
import React from 'react';

interface HypothesisDebateProps {
  healthy: string;
  disease: string;
  isVisible: boolean;
}

export const HypothesisDebate: React.FC<HypothesisDebateProps> = ({ healthy, disease, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8 animate-in fade-in duration-700">
      {/* Healthy Agent Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 className="font-bold text-blue-800">Healthy Hypothesis Agent</h3>
        </div>
        <p className="text-sm text-blue-700 leading-relaxed italic bg-white/50 p-4 rounded-xl">
          "{healthy}"
        </p>
        <div className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">
          Goal: Minimize False Positives • Prefers Benign Explanations
        </div>
      </div>

      {/* Disease Agent Card */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          </div>
          <h3 className="font-bold text-red-800">Disease Hypothesis Agent</h3>
        </div>
        <p className="text-sm text-red-700 leading-relaxed italic bg-white/50 p-4 rounded-xl">
          "{disease}"
        </p>
        <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">
          Goal: Minimize False Negatives • Highlights Abnormality Risks
        </div>
      </div>
    </div>
  );
};
