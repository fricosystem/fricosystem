
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Set theme to dark by default
const setInitialTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // Default to dark theme
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
};

// Execute theme setting before rendering
setInitialTheme();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
