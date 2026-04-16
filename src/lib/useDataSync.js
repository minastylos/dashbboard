import { useEffect } from 'react';

const channel = new BroadcastChannel('emprestimo_express_sync');

/**
 * Escuta mudanças vindas de OUTRAS abas do mesmo navegador.
 * Quando qualquer aba salva/deleta dados, as outras abas recebem o aviso
 * e executam o callback (que normalmente recarrega os dados).
 */
export function useDataSync(onUpdate) {
  useEffect(() => {
    function handleBroadcast(event) {
      if (event.data?.type === 'data_changed' && onUpdate) {
        onUpdate();
      }
    }

    // BroadcastChannel – abas na mesma origem
    channel.addEventListener('message', handleBroadcast);

    // storage event – fallback cross-tab (só dispara em OUTRAS abas)
    function handleStorage(event) {
      if (event.key?.startsWith('ee_') && onUpdate) {
        onUpdate();
      }
    }
    window.addEventListener('storage', handleStorage);

    return () => {
      channel.removeEventListener('message', handleBroadcast);
      window.removeEventListener('storage', handleStorage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
