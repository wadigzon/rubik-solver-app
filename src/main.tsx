import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  const div = document.createElement('div');
  div.style.color = 'red';
  div.style.background = 'white';
  div.style.padding = '20px';
  div.style.position = 'absolute';
  div.style.top = '0';
  div.style.left = '0';
  div.style.zIndex = '9999';
  div.textContent = `Error: ${e.message}\n${e.error?.stack || ''}`;
  document.body.appendChild(div);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
