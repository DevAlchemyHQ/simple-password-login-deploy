import React, { useState, useEffect } from 'react';
import { Ruler } from 'lucide-react';

interface UnitConversion {
  value: string;
  unit: string;
  convert: (value: number) => number;
  convertBack: (value: number) => number;
}

const units: UnitConversion[] = [
  { 
    value: '', 
    unit: 'Meters (m)', 
    convert: (v) => v,
    convertBack: (v) => v 
  },
  { 
    value: '', 
    unit: 'Millimeters (mm)', 
    convert: (v) => v * 1000,
    convertBack: (v) => v / 1000 
  },
  { 
    value: '', 
    unit: 'Feet (ft)', 
    convert: (v) => v * 3.28084,
    convertBack: (v) => v / 3.28084 
  },
  { 
    value: '', 
    unit: 'Centimeters (cm)', 
    convert: (v) => v * 100,
    convertBack: (v) => v / 100 
  },
  { 
    value: '', 
    unit: 'Inches (in)', 
    convert: (v) => v * 39.3701,
    convertBack: (v) => v / 39.3701 
  }
];

export const UnitConverter: React.FC = () => {
  const [conversions, setConversions] = useState<UnitConversion[]>(units);

  const handleInputChange = (index: number, value: string) => {
    // Clear all values if input is empty
    if (!value) {
      setConversions(units.map(unit => ({ ...unit, value: '' })));
      return;
    }

    // Only allow numbers and decimal points
    if (!/^\d*\.?\d*$/.test(value)) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    // Convert the input value to meters (base unit)
    const metersValue = conversions[index].convertBack(numValue);

    // Update all other values based on the meters value
    const newConversions = conversions.map(unit => ({
      ...unit,
      value: unit.convert(metersValue).toFixed(4).replace(/\.?0+$/, '')
    }));

    setConversions(newConversions);
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Ruler className="text-neutral-700 dark:text-neutral-300" size={24} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Unit Converter
        </h2>
      </div>

      <div className="space-y-3">
        {conversions.map((conversion, index) => (
          <div key={conversion.unit} className="flex items-center gap-3">
            <label className="w-24 text-sm font-semibold text-slate-700 dark:text-gray-300">
              {conversion.unit.split(' ')[0]}
            </label>
            <span className="text-xs text-slate-500 dark:text-gray-400 w-8">
              {conversion.unit.match(/\(([^)]+)\)/)?.[1]}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={conversion.value}
              onChange={(e) => handleInputChange(index, e.target.value)}
              placeholder="0"
              className="flex-1 p-2.5 text-base bg-white dark:bg-neutral-900 border border-slate-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100 focus:border-neutral-900 dark:focus:border-neutral-100 text-slate-900 dark:text-white"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-gray-700">
        <p className="text-xs text-slate-500 dark:text-gray-400">
          Enter a value in any unit to convert to all others automatically
        </p>
      </div>
    </div>
  );
};