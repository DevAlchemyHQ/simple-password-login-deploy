import React, { useState } from 'react';
import { Ruler, Info } from 'lucide-react';

type BrickStandard = 'modern' | 'victorian';

interface BrickDimensions {
  name: string;
  length: number;
  width: number;
  height: number;
  lengthInch: string;
  widthInch: string;
  heightInch: string;
  description: string;
}

const BRICK_STANDARDS: Record<BrickStandard, BrickDimensions> = {
  modern: {
    name: 'Modern Standard Brick',
    length: 215,
    width: 102.5,
    height: 65,
    lengthInch: '8.5"',
    widthInch: '4"',
    heightInch: '2.5"',
    description: 'Post-1965 standard, common in modern repairs'
  },
  victorian: {
    name: 'Victorian Railway Brick',
    length: 230,
    width: 110,
    height: 75,
    lengthInch: '9"',
    widthInch: '4.25"',
    heightInch: '3"',
    description: 'Most common in heritage railway structures'
  }
};

export const MeasurementReference: React.FC = () => {
  const [standard, setStandard] = useState<BrickStandard>('victorian');
  const [numCourses, setNumCourses] = useState('');
  const [numBricks, setNumBricks] = useState('');
  
  const brick = BRICK_STANDARDS[standard];
  const mortarJoint = 10; // mm
  
  const calculateHeight = () => {
    const courses = parseInt(numCourses);
    if (isNaN(courses) || courses <= 0) return null;
    
    const totalHeight = (courses * brick.height) + ((courses - 1) * mortarJoint);
    return totalHeight;
  };
  
  const calculateLength = () => {
    const bricks = parseInt(numBricks);
    if (isNaN(bricks) || bricks <= 0) return null;
    
    const totalLength = (bricks * brick.length) + ((bricks - 1) * mortarJoint);
    return totalLength;
  };
  
  const calculatedHeight = calculateHeight();
  const calculatedLength = calculateLength();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Ruler className="text-indigo-500" size={24} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Measurement Reference
        </h2>
      </div>

      <div className="space-y-3">
        {/* Standard Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
            Brick Standard:
          </label>
          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value as BrickStandard)}
            className="w-full p-2.5 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="victorian">Victorian Railway Brick (Pre-1965)</option>
            <option value="modern">Modern Standard Brick (Post-1965)</option>
          </select>
        </div>

        {/* Brick Dimensions Display */}
        <div className="p-3 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Info size={14} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-600 dark:text-gray-300">
              {brick.description}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Length</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {brick.length}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.lengthInch}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Width</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {brick.width}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.widthInch}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Height</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                {brick.height}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.heightInch}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-gray-600">
            <p className="text-xs text-slate-500 dark:text-gray-400">
              With 10mm mortar: <span className="font-semibold text-slate-700 dark:text-gray-300">{brick.length + mortarJoint} × {brick.width + mortarJoint} × {brick.height + mortarJoint}mm</span>
            </p>
          </div>
        </div>

        {/* Calculators - Side by Side */}
        <div className="grid grid-cols-2 gap-3">
          {/* Course Height Calculator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Height (Courses):
            </label>
            <input
              type="number"
              value={numCourses}
              onChange={(e) => setNumCourses(e.target.value)}
              placeholder="# courses"
              min="1"
              className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
            
            {calculatedHeight && (
              <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-gray-300">Height:</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {calculatedHeight}mm
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  ({(calculatedHeight / 1000).toFixed(2)}m)
                </p>
              </div>
            )}
          </div>

          {/* Brick Length Calculator */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Length (Bricks):
            </label>
            <input
              type="number"
              value={numBricks}
              onChange={(e) => setNumBricks(e.target.value)}
              placeholder="# bricks"
              min="1"
              className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
            />
            
            {calculatedLength && (
              <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-gray-300">Length:</p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {calculatedLength}mm
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  ({(calculatedLength / 1000).toFixed(2)}m)
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Note */}
        <div className="pt-2 border-t border-slate-200 dark:border-gray-700">
          <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
            <strong className="text-slate-600 dark:text-gray-300">Note:</strong> Count visible brick courses/bricks in photos to estimate dimensions.
          </p>
        </div>
      </div>
    </div>
  );
};
