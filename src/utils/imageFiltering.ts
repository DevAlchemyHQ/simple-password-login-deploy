/**
 * Shared image filtering utilities.
 * Extracts duplicate logic from DefectTile and SelectedImagesPanel.
 */

/**
 * Extracts the last 4 digits from a filename for photo number matching.
 *
 * Examples:
 * - "PB080001.jpg" → "0001"
 * - "PB080001 copy.jpg" → "0001"
 * - "IMG_0042.jpg" → "0042"
 * - "photo123.jpg" → "0123"
 *
 * @param filename - The filename to extract digits from
 * @returns The last 4 digits (zero-padded if needed), or empty string if no digits found
 */
export const getLastFourDigits = (filename: string): string => {
  // Remove file extension first
  const nameWithoutExt = filename.replace(/\.[^.]+$/, '');

  // Find all sequences of consecutive digits
  const digitSequences = nameWithoutExt.match(/\d+/g);
  if (!digitSequences || digitSequences.length === 0) {
    return '';
  }

  // Get the last sequence of digits (this is the photo number)
  const lastSequence = digitSequences[digitSequences.length - 1];

  // If the sequence has 4 or more digits, take the last 4
  if (lastSequence.length >= 4) {
    return lastSequence.slice(-4);
  }

  // If less than 4 digits, pad with leading zeros
  return lastSequence.padStart(4, '0');
};

/**
 * Filters a list of filenames by a search query.
 *
 * If the query is numeric, searches by last 4 digits.
 * If the query is non-numeric, searches by filename (case-insensitive).
 *
 * @param files - Array of filenames to filter
 * @param searchQuery - The search query
 * @returns Filtered array of filenames
 */
export const filterFilesByQuery = (files: string[], searchQuery: string): string[] => {
  if (!searchQuery) {
    return files;
  }

  const query = String(searchQuery).trim();
  if (!query || query.length === 0) {
    return files;
  }

  // Check if query is purely numeric
  const isNumericQuery = /^\d+$/.test(query);

  if (isNumericQuery) {
    return files.filter(file => {
      const lastFour = getLastFourDigits(file);

      // Must have exactly 4 digits
      if (!lastFour || lastFour.length !== 4) {
        return false;
      }

      if (query.length === 1) {
        // Single digit: must be the last digit, and all preceding digits must be zeros
        // Example: Query "1" matches "0001" but NOT "0011"
        const lastDigit = lastFour.slice(-1);
        const precedingDigits = lastFour.slice(0, -1);

        const digitMatches = lastDigit === query;
        const precedingAreZeros = /^0+$/.test(precedingDigits);

        return digitMatches && precedingAreZeros;
      } else {
        // Multi-digit: must end with query
        // Example: Query "01" matches "0001"
        return lastFour.endsWith(query);
      }
    });
  }

  // Non-numeric query: search by filename
  const queryLower = query.toLowerCase();
  return files.filter(file => file.toLowerCase().includes(queryLower));
};

/**
 * Filters images by their file names using the same logic as filterFilesByQuery.
 *
 * @param images - Array of image objects with file.name property
 * @param searchQuery - The search query
 * @returns Filtered array of images
 */
export const filterImagesByQuery = <T extends { file: { name: string } }>(
  images: T[],
  searchQuery: string
): T[] => {
  if (!searchQuery) {
    return images;
  }

  const query = String(searchQuery).trim();
  if (!query || query.length === 0) {
    return images;
  }

  const isNumericQuery = /^\d+$/.test(query);

  if (isNumericQuery) {
    return images.filter(image => {
      const lastFour = getLastFourDigits(image.file.name);

      if (!lastFour || lastFour.length !== 4) {
        return false;
      }

      if (query.length === 1) {
        const lastDigit = lastFour.slice(-1);
        const precedingDigits = lastFour.slice(0, -1);

        const digitMatches = lastDigit === query;
        const precedingAreZeros = /^0+$/.test(precedingDigits);

        return digitMatches && precedingAreZeros;
      } else {
        return lastFour.endsWith(query);
      }
    });
  }

  const queryLower = query.toLowerCase();
  return images.filter(image => image.file.name.toLowerCase().includes(queryLower));
};
