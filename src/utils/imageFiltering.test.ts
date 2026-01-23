import { describe, it, expect } from 'vitest';
import { getLastFourDigits, filterFilesByQuery, filterImagesByQuery } from './imageFiltering';

describe('getLastFourDigits', () => {
  it('should extract last 4 digits from filename', () => {
    expect(getLastFourDigits('IMG_1234.jpg')).toBe('1234');
    expect(getLastFourDigits('photo_5678.png')).toBe('5678');
  });

  it('should pad short digit sequences', () => {
    expect(getLastFourDigits('IMG_12.jpg')).toBe('0012');
    expect(getLastFourDigits('photo_5.png')).toBe('0005');
  });

  it('should return last 4 digits of longer sequences', () => {
    expect(getLastFourDigits('IMG_123456789.jpg')).toBe('6789');
  });

  it('should return empty string for filenames without digits', () => {
    expect(getLastFourDigits('photo.jpg')).toBe('');
    expect(getLastFourDigits('image-file.png')).toBe('');
  });

  it('should handle multiple digit sequences', () => {
    expect(getLastFourDigits('2024_01_15_photo_5678.jpg')).toBe('5678');
  });

  it('should handle extensions correctly', () => {
    expect(getLastFourDigits('file1234.jpeg')).toBe('1234');
    expect(getLastFourDigits('img5678.HEIC')).toBe('5678');
  });
});

describe('filterFilesByQuery', () => {
  const testFiles = [
    'IMG_1234.jpg',
    'photo_5678.png',
    'landscape_9012.jpg',
    'portrait.jpg',
    'DSC_0001.jpg',
  ];

  it('should return all files when query is empty', () => {
    expect(filterFilesByQuery(testFiles, '')).toEqual(testFiles);
    expect(filterFilesByQuery(testFiles, '  ')).toEqual(testFiles);
  });

  it('should filter by filename match', () => {
    const result = filterFilesByQuery(testFiles, 'landscape');
    expect(result).toEqual(['landscape_9012.jpg']);
  });

  it('should filter by last 4 digits', () => {
    const result = filterFilesByQuery(testFiles, '1234');
    expect(result).toEqual(['IMG_1234.jpg']);
  });

  it('should be case insensitive', () => {
    expect(filterFilesByQuery(testFiles, 'IMG')).toEqual(['IMG_1234.jpg']);
    expect(filterFilesByQuery(testFiles, 'img')).toEqual(['IMG_1234.jpg']);
  });

  it('should return empty array when no matches', () => {
    expect(filterFilesByQuery(testFiles, 'nonexistent')).toEqual([]);
    expect(filterFilesByQuery(testFiles, '9999')).toEqual([]);
  });
});

describe('filterImagesByQuery', () => {
  const testImages = [
    { id: '1', file: { name: 'IMG_1234.jpg' } },
    { id: '2', file: { name: 'photo_5678.png' } },
    { id: '3', file: { name: 'landscape.jpg' } },
  ];

  it('should return all images when query is empty', () => {
    expect(filterImagesByQuery(testImages, '')).toEqual(testImages);
  });

  it('should filter by filename', () => {
    const result = filterImagesByQuery(testImages, 'photo');
    expect(result).toHaveLength(1);
    expect(result[0].file.name).toBe('photo_5678.png');
  });

  it('should filter by last 4 digits', () => {
    const result = filterImagesByQuery(testImages, '1234');
    expect(result).toHaveLength(1);
    expect(result[0].file.name).toBe('IMG_1234.jpg');
  });
});
