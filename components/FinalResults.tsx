
import React from 'react';
import { AssessmentData } from '../types';

interface FinalResultsProps {
  data: AssessmentData;
}

export const FinalResults: React.FC<FinalResultsProps> = ({ data }) => {
  const getVerdictStyles = (verdict: string) => {
    switch (verdict) {
      case 'Likely Healthy': return 'bg-green-100 text-green-700 border-green-200';
      case 'Possibly Healthy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Possibly Abnormal': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Likely Abnormal': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8">
           <div className={`px-4 py-2 rounded-full border font-bold text-sm uppercase tracking-widest ${getVerdictStyles(data.arbitrationVerdict)}`}>
            {data.arbitrationVerdict}
           </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04m12.892 3.381A3.333 3.333 0 0112 15c-1.842 0-3.333-1.491-3.333-3.333m0 0c0-1.842 1.491-3.333 3.333-3.333m0 0c1.842 0 3.333 1.491 3.333 3.333M9 15c0 1.842 1.491 3.333 3.333 3.333m0 0c1.842 0 3.333-1.491 3.333-3.333"/></svg>
          Arbitration Verdict
        </h2>

        <div className="prose prose-green max-w-none">
          <p className="text-lg text-gray-700 leading-relaxed font-medium">
            {data.explanation}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Farmer Guidance</h4>
            <ul className="space-y-3">
              {data.guidance.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Data Quality Summary</h4>
            <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Image Reliability</span>
                <span className={`text-xs font-bold ${data.qualityScore > 0.7 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {(data.qualityScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${data.qualityScore > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}
                  style={{ width: `${data.qualityScore * 100}%` }}
                ></div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {data.qualityFlags.map((flag, i) => (
                  <span key={i} className="px-2 py-1 bg-white border border-gray-200 text-[10px] rounded-md font-medium text-gray-600">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p className="text-sm text-amber-800 leading-relaxed font-medium">
          <strong className="block mb-1">Important Ethical Notice:</strong>
          This system is designed for risk signaling and decision support. It does not provide chemical or legal advice. If significant abnormalities are present, we recommend manual validation by a qualified agronomist.
        </p>
      </div>
    </div>
  );
};
