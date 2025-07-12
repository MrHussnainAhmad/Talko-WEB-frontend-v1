import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Polyfill for potential missing lodash functions
if (typeof window !== 'undefined' && !window._) {
  window._ = {
    map: (array, fn) => Array.isArray(array) ? array.map(fn) : [],
    filter: (array, fn) => Array.isArray(array) ? array.filter(fn) : [],
    find: (array, fn) => Array.isArray(array) ? array.find(fn) : undefined,
    forEach: (array, fn) => Array.isArray(array) ? array.forEach(fn) : undefined,
    includes: (array, item) => Array.isArray(array) ? array.includes(item) : false,
    isArray: Array.isArray,
    isEmpty: (value) => {
      if (value == null) return true;
      if (Array.isArray(value) || typeof value === 'string') return value.length === 0;
      if (typeof value === 'object') return Object.keys(value).length === 0;
      return false;
    }
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
          <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
