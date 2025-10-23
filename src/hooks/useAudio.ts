import { useCallback } from 'react';
import { AudioManager } from '../types/game';

// Simple audio context for sound effects
const createAudioContext = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const createTone = (frequency: number, duration: number, type: OscillatorType = 'sine') => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };

  return { createTone };
};

export const useAudio = (): AudioManager => {
  const playSound = useCallback((type: 'perfect' | 'minor' | 'failure' | 'combo' | 'collapse') => {
    try {
      const { createTone } = createAudioContext();
      
      switch (type) {
        case 'perfect':
          // Pleasant ding sound
          createTone(800, 0.2);
          setTimeout(() => createTone(1000, 0.15), 100);
          break;
          
        case 'minor':
          // Neutral thud
          createTone(400, 0.3, 'square');
          break;
          
        case 'failure':
          // Harsh crack
          createTone(200, 0.4, 'sawtooth');
          break;
          
        case 'combo':
          // Rising tone sequence
          createTone(600, 0.15);
          setTimeout(() => createTone(800, 0.15), 150);
          setTimeout(() => createTone(1000, 0.2), 300);
          break;
          
        case 'collapse':
          // Boom and rumble
          createTone(80, 0.8, 'square');
          setTimeout(() => createTone(60, 0.6, 'sawtooth'), 200);
          break;
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }, []);

  return { playSound };
};