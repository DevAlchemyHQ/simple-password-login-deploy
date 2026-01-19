import React from 'react';
import { MeasurementReference } from './MeasurementReference';
import { UnitConverter } from './UnitConverter';
import { ChainsConverter } from './ChainsConverter';
import { AreaCalculator } from './AreaCalculator';

export const CalculatorTabs: React.FC = () => {
  return (
    <div className="h-[calc(100vh-120px)] overflow-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <MeasurementReference />
        <UnitConverter />
        <ChainsConverter />
        <AreaCalculator />
      </div>
    </div>
  );
};