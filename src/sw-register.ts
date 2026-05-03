if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Verifica atualizações a cada mudança de visibilidade da página
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          registration.update();
        }
      });

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Nova versão disponível, recarregar automaticamente para aplicar atualização
                window.location.reload();
              }
            }
          };
        }
      };
    }).catch(error => {
      console.error('SW registration failed:', error);
    });
  });
}
