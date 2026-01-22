import React, { useState } from 'react';
import { Calculator, Delete } from 'lucide-react';

export const BasicCalculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const handleNumber = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDecimal = () => {
    if (newNumber) {
      setDisplay('0.');
      setNewNumber(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperation = (op: string) => {
    const current = parseFloat(display);
    
    if (previousValue !== null && operation && !newNumber) {
      calculate();
    } else {
      setPreviousValue(current);
    }
    
    setOperation(op);
    setNewNumber(true);
  };

  const calculate = () => {
    if (previousValue === null || operation === null) return;
    
    const current = parseFloat(display);
    let result = 0;
    
    switch (operation) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '×':
        result = previousValue * current;
        break;
      case '÷':
        result = current !== 0 ? previousValue / current : 0;
        break;
      default:
        return;
    }
    
    setDisplay(result.toString());
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setNewNumber(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setNewNumber(true);
    }
  };

  const handlePercentage = () => {
    const current = parseFloat(display);
    setDisplay((current / 100).toString());
  };

  const handleNegate = () => {
    const current = parseFloat(display);
    setDisplay((-current).toString());
  };

  const Button: React.FC<{
    label: string;
    onClick: () => void;
    className?: string;
    span?: boolean;
  }> = ({ label, onClick, className = '', span = false }) => (
    <button
      onClick={onClick}
      className={`
        ${span ? 'col-span-2' : ''}
        p-4 text-lg font-semibold rounded-lg transition-colors
        ${className || 'bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-gray-600'}
      `}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <Calculator className="text-neutral-700 dark:text-neutral-300" size={24} />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">
          Calculator
        </h2>
      </div>

      {/* Display */}
      <div className="mb-4 p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg">
        <div className="text-right">
          {previousValue !== null && operation && (
            <div className="text-sm text-slate-500 dark:text-gray-400 mb-1">
              {previousValue} {operation}
            </div>
          )}
          <div className="text-3xl font-bold text-slate-800 dark:text-white break-all">
            {display}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <Button label="C" onClick={handleClear} className="bg-red-500 text-white hover:bg-red-600" />
        <button
          onClick={handleBackspace}
          className="p-4 bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center"
        >
          <Delete size={20} />
        </button>
        <Button label="%" onClick={handlePercentage} />
        <Button label="÷" onClick={() => handleOperation('÷')} className="bg-black dark:bg-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-700" />

        {/* Row 2 */}
        <Button label="7" onClick={() => handleNumber('7')} />
        <Button label="8" onClick={() => handleNumber('8')} />
        <Button label="9" onClick={() => handleNumber('9')} />
        <Button label="×" onClick={() => handleOperation('×')} className="bg-black dark:bg-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-700" />

        {/* Row 3 */}
        <Button label="4" onClick={() => handleNumber('4')} />
        <Button label="5" onClick={() => handleNumber('5')} />
        <Button label="6" onClick={() => handleNumber('6')} />
        <Button label="-" onClick={() => handleOperation('-')} className="bg-indigo-500 text-white hover:bg-indigo-600" />

        {/* Row 4 */}
        <Button label="1" onClick={() => handleNumber('1')} />
        <Button label="2" onClick={() => handleNumber('2')} />
        <Button label="3" onClick={() => handleNumber('3')} />
        <Button label="+" onClick={() => handleOperation('+')} className="bg-black dark:bg-neutral-800 text-white hover:bg-neutral-900 dark:hover:bg-neutral-700" />

        {/* Row 5 */}
        <Button label="+/-" onClick={handleNegate} />
        <Button label="0" onClick={() => handleNumber('0')} />
        <Button label="." onClick={handleDecimal} />
        <Button label="=" onClick={calculate} className="bg-green-500 text-white hover:bg-green-600" />
      </div>
    </div>
  );
};
