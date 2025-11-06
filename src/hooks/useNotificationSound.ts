import { useCallback, useRef } from 'react';

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback(() => {
    try {
      // Criar contexto de áudio se não existir
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const context = audioContextRef.current;
      
      // Criar oscilador para gerar som
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Configurar som (frequência 800Hz por 0.2s, depois 600Hz por 0.2s)
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;

      oscillator.start(context.currentTime);
      oscillator.frequency.setValueAtTime(600, context.currentTime + 0.2);
      oscillator.stop(context.currentTime + 0.4);

      // Repetir o som 3 vezes
      setTimeout(() => {
        const osc2 = context.createOscillator();
        const gain2 = context.createGain();
        osc2.connect(gain2);
        gain2.connect(context.destination);
        osc2.frequency.value = 800;
        gain2.gain.value = 0.3;
        osc2.start(context.currentTime);
        osc2.frequency.setValueAtTime(600, context.currentTime + 0.2);
        osc2.stop(context.currentTime + 0.4);
      }, 500);

      setTimeout(() => {
        const osc3 = context.createOscillator();
        const gain3 = context.createGain();
        osc3.connect(gain3);
        gain3.connect(context.destination);
        osc3.frequency.value = 800;
        gain3.gain.value = 0.3;
        osc3.start(context.currentTime);
        osc3.frequency.setValueAtTime(600, context.currentTime + 0.2);
        osc3.stop(context.currentTime + 0.4);
      }, 1000);

    } catch (error) {
      console.error('Erro ao reproduzir som:', error);
    }
  }, []);

  return { playSound };
};
