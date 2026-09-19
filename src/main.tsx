import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { isEnvConfigured } from './config/env';
import EnvSetupScreen from './components/EnvSetupScreen';

console.log('🚀 [APEX ERP] main.tsx iniciado');

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const root = createRoot(rootElement);

if (isEnvConfigured) {
  // Import dinâmico: o App só é avaliado quando o ambiente está configurado,
  // evitando que a inicialização do Firebase quebre o bundle inteiro.
  void import('./App').then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  });
} else {
  root.render(
    <React.StrictMode>
      <EnvSetupScreen />
    </React.StrictMode>
  );
}

// Registrar Service Worker para PWA (apenas em produção, nunca no preview/dev)
const shouldRegisterSW = (() => {
  if (!import.meta.env.PROD) return false;
  if (typeof window === 'undefined') return false;
  if (window.self !== window.top) return false;
  const h = window.location.hostname;
  if (h.startsWith('id-preview--') || h.startsWith('preview--')) return false;
  if (h === 'lovableproject.com' || h.endsWith('.lovableproject.com')) return false;
  if (h === 'lovableproject-dev.com' || h.endsWith('.lovableproject-dev.com')) return false;
  if (h === 'beta.lovable.dev' || h.endsWith('.beta.lovable.dev')) return false;
  if (new URLSearchParams(window.location.search).has('sw')) return false;
  return true;
})();

if ('serviceWorker' in navigator && !shouldRegisterSW) {
  // Remove registros antigos que servem cache desatualizado no preview/dev
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => {
      if (reg.active?.scriptURL.includes('/sw.js')) reg.unregister();
    });
  });
}

if ('serviceWorker' in navigator && shouldRegisterSW) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[APEX ERP PWA] Service Worker registrado com sucesso:', registration);

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
              console.log('[APEX ERP PWA] Nova versão disponível');
              // Aqui você pode exibir uma notificação para o usuário
            }
          });
        }
      });
    } catch (error) {
      console.error('[APEX ERP PWA] Erro ao registrar Service Worker:', error);
    }
  });
}
