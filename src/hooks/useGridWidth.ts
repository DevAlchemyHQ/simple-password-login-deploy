import { useState, useCallback } from 'react';

const MIN_WIDTH = 4;
const MAX_WIDTH = 8;

export const useGridWidth = (initialWidth = 4) => { // Default grid width is 4
  const [gridWidth, setGridWidth] = useState(
    Math.min(Math.max(initialWidth, MIN_WIDTH), MAX_WIDTH)
  );
  
  const updateGridWidth = useCallback((newWidth: number) => {
    setGridWidth(Math.min(Math.max(newWidth, MIN_WIDTH), MAX_WIDTH));
  }, []);
  
  return {
    gridWidth,
    setGridWidth: updateGridWidth,
    MIN_WIDTH,
    MAX_WIDTH,
  };
};
