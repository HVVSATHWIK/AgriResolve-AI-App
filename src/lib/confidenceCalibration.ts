import type { AssessmentData } from '../types';

export type ConfidenceBreakdown = {
  final: number; // 0..1
  label: string;
  labelKey: string;
  reasons: string[];
  reasonParts: Array<{ key: string; params?: Record<string, unknown> }>;
  components: {
    base: number;
    modelSignal: number; // 0..1
    quality: number; // 0..1
    symptomClarity: number; // 0..1
    consistency: number; // 0..1
    ambiguity: number; // 0..1
    cap?: number; // 0..1
  };
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function variance(values: number[]) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) / values.length;
  return v;
}

function pct(n: number) {
  return `${Math.round(clamp01(n) * 100)}%`;
}

export function calibrateConfidence(params: {
  modelSignal: number; // 0..1, comes from LLM score
  qualityScore?: number; // 0..1
  qualityFlags?: string[];
  symptomCount?: number;
  multipleLeaves?: boolean;
  visuallySimilarConditions?: boolean;
  perLeafConfidences?: number[];
  decision?: string;
}): ConfidenceBreakdown {
  const modelSignal = clamp01(params.modelSignal);
  const quality = clamp01(typeof params.qualityScore === 'number' ? params.qualityScore : 0.7);
  const flags = Array.isArray(params.qualityFlags) ? params.qualityFlags : [];

  // Symptom clarity proxy: how many distinct anomalies were detected.
  const symptomCount = Math.max(0, params.symptomCount ?? 0);
  const symptomClarity = clamp01(Math.min(1, symptomCount / 5));

  // Multi-leaf consistency proxy: variance of leaf confidences (if available).
  const leafConfs = (params.perLeafConfidences ?? []).map(clamp01);
  const v = variance(leafConfs);
  // Rough mapping: v=0 -> 1, v>=0.06 -> 0
  const consistency = clamp01(1 - v / 0.06);

  const ambiguity = params.visuallySimilarConditions ? 0 : 1;

  // Weighted blend: quality is the biggest factor.
  let final = 0.10 + 0.30 * modelSignal + 0.35 * quality + 0.15 * symptomClarity + 0.10 * consistency;
  // Ambiguity penalty.
  if (params.visuallySimilarConditions) final -= 0.12;
  if (params.multipleLeaves && leafConfs.length >= 2 && consistency < 0.55) final -= 0.10;

  // Hard caps for realism.
  let cap: number | undefined;
  if (quality < 0.45) cap = 0.55;
  if (flags.some((f) => String(f).includes('BLURRY') || String(f).includes('LOW_LIGHT'))) {
    cap = Math.min(cap ?? 1, 0.65);
  }
  if (params.visuallySimilarConditions) {
    cap = Math.min(cap ?? 1, 0.70);
  }
  if (params.decision === 'Unknown' || params.decision === 'Indeterminate' || params.decision === 'Not a Leaf') {
    cap = Math.min(cap ?? 1, 0.60);
  }

  final = clamp01(final);
  if (typeof cap === 'number') final = Math.min(final, cap);

  // Floor so we avoid showing false certainty at 0 unless invalid.
  if (params.decision === 'Not a Leaf') final = 0;
  else final = Math.max(final, 0.08);

  const reasonParts: Array<{ key: string; params?: Record<string, unknown> }> = [];
  reasonParts.push({ key: 'reason_quality', params: { pct: pct(quality) } });
  reasonParts.push({ key: 'reason_model_signal', params: { pct: pct(modelSignal) } });
  reasonParts.push({ key: 'reason_symptom_clarity', params: { pct: pct(symptomClarity), cues: symptomCount } });
  if (leafConfs.length >= 2) reasonParts.push({ key: 'reason_consistency', params: { pct: pct(consistency), variance: v.toFixed(2) } });
  if (params.visuallySimilarConditions) reasonParts.push({ key: 'reason_ambiguity_lookalikes' });
  if (params.multipleLeaves) reasonParts.push({ key: 'reason_multiple_leaves' });
  if (typeof cap === 'number') reasonParts.push({ key: 'reason_cap_applied', params: { pct: pct(cap) } });

  const reasons: string[] = [];
  reasons.push(`Quality: ${pct(quality)}`);
  reasons.push(`Model signal: ${pct(modelSignal)}`);
  reasons.push(`Symptom clarity: ${pct(symptomClarity)} (${symptomCount} cues)`);
  if (leafConfs.length >= 2) reasons.push(`Consistency: ${pct(consistency)} (leaf variance ${v.toFixed(2)})`);
  if (params.visuallySimilarConditions) reasons.push('Ambiguity: lookalikes likely');
  if (params.multipleLeaves) reasons.push('Multiple leaves present');
  if (typeof cap === 'number') reasons.push(`Cap applied: ${pct(cap)}`);

  const labelKey =
    final >= 0.75
      ? 'evidence_strength_high'
      : final >= 0.55
        ? 'evidence_strength_moderate'
        : final > 0
          ? 'evidence_strength_low'
          : 'evidence_strength_na';

  const label =
    final >= 0.75
      ? 'High evidence strength'
      : final >= 0.55
        ? 'Moderate evidence strength'
        : final > 0
          ? 'Low evidence strength'
          : 'Not applicable';

  return {
    final,
    label,
    labelKey,
    reasons,
    reasonParts,
    components: {
      base: 0.10,
      modelSignal,
      quality,
      symptomClarity,
      consistency,
      ambiguity,
      cap,
    },
  };
}

export function calibrateForAssessment(
  assessment: AssessmentData,
  modelSignal: number
): ConfidenceBreakdown {
  const perLeafConfidences = Array.isArray(assessment.leafAssessments)
    ? assessment.leafAssessments
        .map((l) => (typeof l.confidence === 'number' ? l.confidence : 0))
        .filter((n) => Number.isFinite(n))
    : [];

  const flags = Array.isArray(assessment.quality?.flags) ? (assessment.quality.flags as unknown as string[]) : [];

  return calibrateConfidence({
    modelSignal,
    qualityScore: assessment.quality?.score,
    qualityFlags: flags,
    symptomCount: Array.isArray(assessment.visionEvidence?.anomalies_detected) ? assessment.visionEvidence.anomalies_detected.length : 0,
    multipleLeaves: Boolean(assessment.uncertaintyFactors?.multipleLeaves),
    visuallySimilarConditions: Boolean(assessment.uncertaintyFactors?.visuallySimilarConditions),
    perLeafConfidences,
    decision: assessment.arbitrationResult?.decision,
  });
}
