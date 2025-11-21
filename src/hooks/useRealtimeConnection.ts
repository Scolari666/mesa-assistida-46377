import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

export const useRealtimeConnection = (userId: string | undefined) => {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const connect = useCallback(() => {
    if (!userId) return;

    setStatus('connecting');
    
    const newChannel = supabase
      .channel(`calls-realtime-${userId}`, {
        config: {
          broadcast: { self: true },
          presence: { key: userId },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calls',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Callback será definido externamente
        }
      )
      .on('system', {}, (payload) => {
        if (payload.extension === 'postgres_changes') {
          if (payload.status === 'ok') {
            setStatus('connected');
            setReconnectAttempt(0);
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
          setReconnectAttempt(0);
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('disconnected');
          // Tentar reconectar após 3 segundos
          setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
          }, 3000);
        } else if (status === 'TIMED_OUT') {
          setStatus('disconnected');
          setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
          }, 3000);
        }
      });

    setChannel(newChannel);
  }, [userId]);

  useEffect(() => {
    connect();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [connect, reconnectAttempt]);

  const disconnect = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
      setStatus('disconnected');
    }
  }, [channel]);

  return { status, channel, disconnect, reconnect: connect };
};
