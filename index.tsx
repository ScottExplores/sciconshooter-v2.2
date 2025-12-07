import React from 'react';
import ReactDOM from 'react-dom/client';
import { ethers } from 'ethers'; // 1. Import the library from package.json
import App from './App';

// 2. Make ethers global so the rest of your app can "see" it automatically
// (This fixes the "library not loaded" error)
// @ts-ignore
window.ethers = ethers;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
