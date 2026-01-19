import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Clean up corrupted localStorage on app start
try {
  const projectData = localStorage.getItem('userProjectData');
  
  if (projectData) {
    const parsed = JSON.parse(projectData);
    
    // Check for corrupted bulk defects (anything > 10000 is likely corrupted)
    // Normal usage should never exceed 10000 tiles
    if (parsed.bulkDefects && Array.isArray(parsed.bulkDefects) && parsed.bulkDefects.length > 10000) {
      console.warn('Detected corrupted localStorage (excessive bulkDefects), clearing...');
      localStorage.removeItem('userProjectData');
    }
  }
} catch (e) {
  console.warn('Error checking localStorage, clearing...', e);
  localStorage.removeItem('userProjectData');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
