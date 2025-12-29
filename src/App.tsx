
import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { StepIndicator } from './components/StepIndicator';
import { AssessmentStatus, AssessmentData } from './types';
import { runAgenticPipeline } from './services/orchestrator';
import { HypothesisDebate } from './components/HypothesisDebate';
import { FinalResults } from './components/FinalResults';
import { AgentVisualizer } from './components/AgentVisualizer';
import { ScanOverlay } from './components/ScanOverlay';
import Scene3D from './components/3d/Scene';

const App: React.FC = () => {
  const [status, setStatus] = useState<AssessmentStatus>(AssessmentStatus.IDLE);
  const [image, setImage] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
        startAssessment(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAssessment = async (img: string) => {
    setStatus(AssessmentStatus.PERCEIVING);
    setError(null);
    setData(null);

    try {
      const result = await runAgenticPipeline(img, (newStatus) => {
        setStatus(newStatus);
      });
      setData(result);
    } catch (err) {
      console.error(err);
      setError('An error occurred during assessment. Please try with a clearer image.');
      setStatus(AssessmentStatus.ERROR);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const reset = () => {
    setStatus(AssessmentStatus.IDLE);
    setImage(null);
    setData(null);
    setError(null);
  };

  return (
    <Layout>
      <Scene3D />
      <div className="relative z-10 mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Crop Health Risk Assessment
        </h2>
        <p className="text-gray-500 mt-2 text-lg">
          Upload a single leaf image for an explainable, multi-agent evaluation.
        </p>
      </div>

      {status === AssessmentStatus.IDLE || status === AssessmentStatus.ERROR ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border-4 border-dashed border-gray-200 rounded-3xl bg-white p-8 group hover:border-green-400 transition-colors duration-300">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Ready to Analyze</h3>
          <p className="text-gray-500 mt-2 text-center max-w-sm mb-8">
            Take a clear picture of a single leaf on a neutral background for the best results.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={triggerUpload}
            className="px-8 py-4 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-1 transition-all active:scale-95"
          >
            Upload Leaf Image
          </button>

          {error && (
            <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {/* Main Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Image Preview */}
            <div className="lg:col-span-5">
              <div className="sticky top-8 bg-white p-4 rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                  <img src={image!} alt="Uploaded leaf" className="w-full h-full object-cover" />

                  {/* Scan Animation Overlay */}
                  <ScanOverlay isActive={status === AssessmentStatus.PERCEIVING || status === AssessmentStatus.EVALUATING} />

                  {/* Vision Overlay Effect */}
                  {status === AssessmentStatus.PERCEIVING && (
                    <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                      <div className="w-full h-1 bg-green-400 absolute top-0 animate-[scan_2s_infinite_ease-in-out]"></div>
                      <span className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold text-green-600 shadow-sm border border-green-100">
                        Extracting Visual Evidence...
                      </span>
                    </div>
                  )}

                  {/* Heatmap Overlay (Mock) */}
                  {status === AssessmentStatus.COMPLETED && (
                    <div className="absolute inset-0 bg-red-500/10 mix-blend-multiply opacity-50 pointer-events-none"></div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Input Raw Data</span>
                  {status === AssessmentStatus.COMPLETED && (
                    <button onClick={reset} className="text-xs font-bold text-green-600 hover:underline">
                      Analyze New Sample
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Workflow Progress */}
            <div className="lg:col-span-7">
              <AgentVisualizer status={status} />
            </div>
          </div>

          <HypothesisDebate
            healthy={data?.healthyResult}
            disease={data?.diseaseResult}
            isVisible={[AssessmentStatus.DEBATING, AssessmentStatus.ARBITRATING, AssessmentStatus.EXPLAINING, AssessmentStatus.COMPLETED].includes(status)}
          />

          {status === AssessmentStatus.COMPLETED && data && (
            <FinalResults data={data} />
          )}
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
      `}</style>
    </Layout>
  );
};

export default App;
