import React from 'react';
import { MeasurementReference } from './MeasurementReference';
import { UnitConverter } from './UnitConverter';
import { ChainsConverter } from './ChainsConverter';
import { BasicCalculator } from './BasicCalculator';

export const CalculatorTabs: React.FC = () => {
  return (
    <div className="h-[calc(100vh-120px)] overflow-auto p-4">
      <div className="grid grid-cols-4 gap-6">
        <BasicCalculator />
        <MeasurementReference />
        <UnitConverter />
        <ChainsConverter />
      </div>
    </div>
  );
};