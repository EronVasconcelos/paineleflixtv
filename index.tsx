
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Registro do Service Worker otimizado para produção
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usando caminho relativo para funcionar no Netlify/Vercel
    navigator.serviceWorker.register('./sw.js').then(registration => {
      console.log('EFLIXTV PWA: Registrado com sucesso', registration.scope);
    }).catch(error => {
      console.error('EFLIXTV PWA: Falha no registro', error);
    });
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
