/**
 * Crop Type Selector Component
 * 
 * Allows users to select their crop type before uploading an image for analysis.
 * Requirements: 4.1, 4.3
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';

export enum CropType {
  TOMATO = 'tomato',
  POTATO = 'potato',
  WHEAT = 'wheat',
  CORN = 'corn',
  SOYBEAN = 'soybean',
  GRAPE = 'grape',
  APPLE = 'apple'
}

interface CropInfo {
  type: CropType;
  displayName: string;
  icon: string;
  description: string;
}

const CROP_INFO: CropInfo[] = [
  {
    type: CropType.TOMATO,
    displayName: 'Tomato',
    icon: '🍅',
    description: 'Susceptible to late blight, early blight, and powdery mildew'
  },
  {
    type: CropType.POTATO,
    displayName: 'Potato',
    icon: '🥔',
    description: 'Susceptible to late blight and early blight'
  },
  {
    type: CropType.WHEAT,
    displayName: 'Wheat',
    icon: '🌾',
    description: 'Susceptible to rust, powdery mildew, and bacterial blight'
  },
  {
    type: CropType.CORN,
    displayName: 'Corn',
    icon: '🌽',
    description: 'Susceptible to rust, gray leaf spot, and leaf blight'
  },
  {
    type: CropType.SOYBEAN,
    displayName: 'Soybean',
    icon: '🫘',
    description: 'Susceptible to rust, frogeye leaf spot, and brown spot'
  },
  {
    type: CropType.GRAPE,
    displayName: 'Grape',
    icon: '🍇',
    description: 'Susceptible to powdery mildew, downy mildew, and black rot'
  },
  {
    type: CropType.APPLE,
    displayName: 'Apple',
    icon: '🍎',
    description: 'Susceptible to apple scab, fire blight, and cedar apple rust'
  }
];

interface CropTypeSelectorProps {
  selectedCrop: CropType | null;
  onSelectCrop: (crop: CropType) => void;
}

export const CropTypeSelector: React.FC<CropTypeSelectorProps> = ({
  selectedCrop,
  onSelectCrop
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/20 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl mb-8"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-50/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-inner">
          <Sprout className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 drop-shadow-sm">
            Select Your Crop Type
          </h3>
          <p className="text-sm text-gray-600 font-medium">
            Choose the crop you want to analyze for accurate disease assessment
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {CROP_INFO.map((crop) => (
          <motion.button
            key={crop.type}
            onClick={() => onSelectCrop(crop.type)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-4 rounded-xl border-2 transition-all duration-200 text-left
              ${
                selectedCrop === crop.type
                  ? 'border-green-500 bg-green-50/80 shadow-lg'
                  : 'border-white/40 bg-white/30 hover:bg-white/50 hover:border-green-300'
              }
            `}
          >
            {selectedCrop === crop.type && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            )}
            
            <div className="text-4xl mb-2">{crop.icon}</div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {crop.displayName}
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              {crop.description}
            </p>
          </motion.button>
        ))}
      </div>

      {selectedCrop && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-6 p-4 bg-green-50/80 backdrop-blur-sm rounded-lg border border-green-200"
        >
          <p className="text-sm text-green-800 font-medium">
            ✓ Selected: <span className="font-bold">
              {CROP_INFO.find(c => c.type === selectedCrop)?.displayName}
            </span>
            {' '}— Now upload an image to begin analysis
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CropTypeSelector;
