
import React from 'react';
import { AssessmentStatus } from '../types';

interface StepIndicatorProps {
  currentStatus: AssessmentStatus;
}

const steps = [
  { id: AssessmentStatus.PERCEIVING, label: 'Vision Evidence' },
  { id: AssessmentStatus.EVALUATING, label: 'Quality Check' },
  { id: AssessmentStatus.DEBATING, label: 'Dual-Agent Debate' },
  { id: AssessmentStatus.ARBITRATING, label: 'Final Arbitration' },
  { id: AssessmentStatus.EXPLAINING, label: 'Explanation' }
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStatus }) => {
  const currentIdx = steps.findIndex(s => s.id === currentStatus);
  const isCompleted = currentStatus === AssessmentStatus.COMPLETED;

  return (
    <div className="w-full py-4 mb-8">
      <div className="flex justify-between items-center relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
        {steps.map((step, idx) => {
          const isActive = step.id === currentStatus;
          const isDone = currentIdx > idx || isCompleted;

          return (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                ${isDone ? 'bg-green-500 border-green-500 text-white' : 
                  isActive ? 'bg-white border-green-500 text-green-500 animate-pulse' : 
                  'bg-white border-gray-200 text-gray-400'}
              `}>
                {isDone ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                ) : (
                  <span className="text-sm font-bold">{idx + 1}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
