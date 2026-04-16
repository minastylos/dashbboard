import { useEffect } from 'react';
import { supabase } from './supabase';

const channel = new BroadcastChannel('emprestimo_express_sync');

/**
 * Sincronização em tempo real:
 * - Supabase Realtime: quando outro gestor (outro dispositivo) altera dados
 * - BroadcastChannel: quando outra aba no mesmo navegador altera dados
 */
export function useDataSync(onUpdate) {
  useEffect(() => {
    // Supabase Realtime — sincroniza entre dispositivos diferentes
    const realtimeChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        () => {
          if (onUpdate) onUpdate();
        }
      )
      .subscribe();

    // BroadcastChannel — sincroniza entre abas do mesmo navegador
    function handleBroadcast(event) {
      if (event.data?.type === 'data_changed' && onUpdate) {
        onUpdate();
      }
    }
    channel.addEventListener('message', handleBroadcast);

    return () => {
      supabase.removeChannel(realtimeChannel);
      channel.removeEventListener('message', handleBroadcast);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
