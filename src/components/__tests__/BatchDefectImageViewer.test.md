# BatchDefectImageViewer Test Plan

## Test Cases

### 1. Adjustment Accuracy Tests
- [ ] Brightness: Set to +50, verify image is brighter
- [ ] Brightness: Set to -50, verify image is darker
- [ ] Brightness: Set to 0, verify image returns to original
- [ ] Contrast: Set to +50, verify contrast increases
- [ ] Contrast: Set to -50, verify contrast decreases
- [ ] Contrast: Set to 0, verify image returns to original
- [ ] Saturation: Set to +50, verify colors are more vibrant
- [ ] Saturation: Set to -50, verify image becomes grayscale
- [ ] Saturation: Set to 0, verify image returns to original
- [ ] Exposure: Set to +50, verify image is brighter
- [ ] Exposure: Set to -50, verify image is darker
- [ ] Exposure: Set to 0, verify image returns to original
- [ ] Highlights: Set to +50, verify bright areas are brighter
- [ ] Highlights: Set to -50, verify bright areas are darker
- [ ] Highlights: Set to 0, verify image returns to original
- [ ] Shadows: Set to +50, verify dark areas are brighter
- [ ] Shadows: Set to -50, verify dark areas are darker
- [ ] Shadows: Set to 0, verify image returns to original
- [ ] Temperature: Set to +50 (warm), verify image is warmer/yellow
- [ ] Temperature: Set to -50 (cool), verify image is cooler/blue
- [ ] Temperature: Set to 0, verify image returns to original
- [ ] Tint: Set to +50 (magenta), verify magenta tint
- [ ] Tint: Set to -50 (green), verify green tint
- [ ] Tint: Set to 0, verify image returns to original

### 2. Crop Overlay Tests
- [ ] Crop overlay appears on the actual image (not randomly)
- [ ] Crop overlay position matches where user clicks
- [ ] Crop overlay can be resized from corners
- [ ] Crop overlay can be resized from edges
- [ ] Crop overlay can be moved
- [ ] Crop overlay stays within image bounds
- [ ] Crop overlay updates correctly when image is zoomed
- [ ] Crop overlay updates correctly when image is panned

### 3. Reset Functionality Tests
- [ ] Reset button restores all adjustments to 0
- [ ] Reset button restores image to original
- [ ] Reset button clears crop area
- [ ] Reset works after multiple edits
- [ ] Reset works after applying crop

### 4. Undo/Redo Tests
- [ ] Undo reverts last change
- [ ] Redo reapplies last undone change
- [ ] Multiple undos work correctly
- [ ] Multiple redos work correctly
- [ ] Undo/Redo works with adjustments
- [ ] Undo/Redo works with crop

### 5. Persistence Tests
- [ ] Edited images are saved to store
- [ ] Edited images persist after page refresh
- [ ] Edited images are included in downloads
