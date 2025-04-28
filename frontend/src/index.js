import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
if (process.env.NODE_ENV === 'development') {
    const originalError = console.error;
    console.error = (...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('ResizeObserver loop completed with undelivered notifications')
      ) {
        console.log("ResizeObserver warning triggered by:", new Error().stack);
        return;
      }
      originalError(...args);
    };
  }
  

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
 
    <App />

);

