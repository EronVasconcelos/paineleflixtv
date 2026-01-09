import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Função para garantir que o botão do sino chame a permissão do navegador
const handleNotificationClick = () => {
  if (typeof (window as any).ativarNotificacoes === 'function') {
    (window as any).ativarNotificacoes();
  } else if (typeof (window as any).ativarNotificacoes === 'undefined') {
    console.error("Função ativarNotificacoes não encontrada no index.html");
    alert("Erro ao carregar módulo de notificações. Tente recarregar a página.");
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {/* O componente App agora terá acesso à lógica de clique */}
    <App onNotificationClick={handleNotificationClick} /> 
  </React.StrictMode>
);