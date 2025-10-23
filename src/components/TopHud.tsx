import React from 'react';
import { GameState } from '../types/game';

interface TopHudProps {
  gameState: GameState;
}

const TopHud: React.FC<TopHudProps> = ({ gameState }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      right: '10px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white',
      fontSize: '18px',
      fontWeight: 'bold',
      zIndex: 100,
      background: 'rgba(0, 0, 0, 0.7)',
      padding: '10px 20px',
      borderRadius: '10px',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div>
          Blocks: <span style={{ color: '#00ff88' }}>{gameState.towerBlocks.length}</span>
        </div>
        <div>
          Score: <span style={{ color: '#ffaa00' }}>{gameState.score}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {gameState.isComboActive && (
          <div style={{
            color: '#ffaa00',
            animation: 'pulse 0.5s infinite alternate',
            textShadow: '0 0 10px #ffaa00'
          }}>
            COMBO x{gameState.comboStreak} 🔥
          </div>
        )}
        
        <div style={{
          color: gameState.timerValue < 30 ? '#ff4444' : '#ffffff'
        }}>
          ⏱️ {formatTime(gameState.timerValue)}
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TopHud;