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
  
  const brick = BRICK_STANDARDS[standard];
  const mortarJoint = 10; // mm
  
  const calculateHeight = () => {
    const courses = parseInt(numCourses);
    if (isNaN(courses) || courses <= 0) return null;
    
    const totalHeight = (courses * brick.height) + ((courses - 1) * mortarJoint);
    return totalHeight;
  };
  
  const calculatedHeight = calculateHeight();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Ruler className="text-indigo-500" size={24} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Measurement Reference
        </h2>
      </div>

      <div className="space-y-4">
        {/* Standard Selector */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
            Brick Standard:
          </label>
          <select
            value={standard}
            onChange={(e) => setStandard(e.target.value as BrickStandard)}
            className="w-full p-3 text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="victorian">Victorian Railway Brick (Pre-1965)</option>
            <option value="modern">Modern Standard Brick (Post-1965)</option>
          </select>
        </div>

        {/* Brick Dimensions Display */}
        <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg space-y-3">
          <div className="flex items-start gap-2 mb-3">
            <Info size={16} className="text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-600 dark:text-gray-300">
              {brick.description}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Length</p>
              <p className="text-base font-semibold text-slate-800 dark:text-white">
                {brick.length}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.lengthInch}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Width</p>
              <p className="text-base font-semibold text-slate-800 dark:text-white">
                {brick.width}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.widthInch}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">Height</p>
              <p className="text-base font-semibold text-slate-800 dark:text-white">
                {brick.height}mm
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400">
                {brick.heightInch}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-gray-600">
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-1">
              With 10mm mortar joint
            </p>
            <p className="text-sm text-slate-700 dark:text-gray-300">
              <span className="font-semibold">{brick.length + mortarJoint}mm</span> × 
              <span className="font-semibold"> {brick.width + mortarJoint}mm</span> × 
              <span className="font-semibold"> {brick.height + mortarJoint}mm</span>
            </p>
          </div>
        </div>

        {/* Course Height Calculator */}
        <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
          <label className="block text-sm font-semibold text-slate-700 dark:text-gray-300 mb-2">
            Calculate Height from Courses:
          </label>
          <input
            type="number"
            value={numCourses}
            onChange={(e) => setNumCourses(e.target.value)}
            placeholder="Enter number of brick courses"
            min="1"
            className="w-full p-3 text-base bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
          />
          
          {calculatedHeight && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <p className="text-sm text-slate-600 dark:text-gray-300 mb-1">
                Estimated Height:
              </p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                {calculatedHeight}mm ({(calculatedHeight / 1000).toFixed(2)}m)
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Based on {numCourses} courses with {mortarJoint}mm mortar joints
              </p>
            </div>
          )}
        </div>

        {/* Usage Note */}
        <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
          <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
            <strong className="text-slate-600 dark:text-gray-300">Note:</strong> Use brick courses 
            to estimate dimensions in examination photos. Count visible courses to approximate crack 
            widths, displacement, or structural element sizes.
          </p>
        </div>
      </div>
    </div>
  );
};
