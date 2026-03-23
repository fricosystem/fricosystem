import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[APEX HUB PWA] Service Worker registrado com sucesso:', registration);

      // Verificar por atualizações a cada 24 horas
      setInterval(() => {
        registration.update();
      }, 24 * 60 * 60 * 1000);

      // Escutar por novas versões do service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              console.log('[APEX HUB PWA] Nova versão disponível');
              // Aqui você pode exibir uma notificação para o usuário
            }
          });
        }
      });
    } catch (error) {
      console.error('[APEX HUB PWA] Erro ao registrar Service Worker:', error);
    }
  });
}
