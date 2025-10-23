import React, { useEffect } from 'react';
import { GameState, InputType } from '../types/game';

interface BottomUiProps {
  gameState: GameState;
  onInput: (inputType: InputType) => void;
}

const BottomUi: React.FC<BottomUiProps> = ({ gameState, onInput }) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'a') onInput('A');
      else if (key === 's') onInput('S');
      else if (key === 'd') onInput('D');
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onInput]);

  const getFluencyBarColor = () => {
    switch (gameState.fluencyLevel) {
      case 'perfect': return '#00ff88';
      case 'minor': return '#ffaa00';
      case 'failure': return '#ff4444';
      default: return '#666666';
    }
  };

  const getFluencyBarWidth = () => {
    switch (gameState.fluencyLevel) {
      case 'perfect': return '100%';
      case 'minor': return '60%';
      case 'failure': return '20%';
      default: return '0%';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
      borderRadius: '15px',
      color: 'white',
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      {/* Chunk Prompt */}
      <div style={{
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#ffffff',
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}>
        "{gameState.currentChunk}"
      </div>

      {/* Fluency Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#333',
        borderRadius: '4px',
        marginBottom: '15px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: getFluencyBarWidth(),
          height: '100%',
          background: getFluencyBarColor(),
          borderRadius: '4px',
          transition: 'all 0.3s ease',
          boxShadow: `0 0 10px ${getFluencyBarColor()}`
        }} />
      </div>

      {/* Feedback Text */}
      <div style={{
        textAlign: 'center',
        fontSize: '16px',
        marginBottom: '20px',
        color: getFluencyBarColor(),
        fontWeight: '500',
        minHeight: '20px'
      }}>
        {gameState.feedbackText}
      </div>

      {/* Control Instructions */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '30px',
        fontSize: '14px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px',
          background: 'rgba(0, 255, 136, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 255, 136, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#00ff88' }}>A</div>
          <div style={{ color: '#ccc' }}>Perfect ✅</div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px',
          background: 'rgba(255, 170, 0, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 170, 0, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ffaa00' }}>S</div>
          <div style={{ color: '#ccc' }}>Minor ⚠️</div>
        </div>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '10px',
          background: 'rgba(255, 68, 68, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 68, 68, 0.3)'
        }}>
          <div style={{ fontWeight: 'bold', color: '#ff4444' }}>D</div>
          <div style={{ color: '#ccc' }}>Failure ❌</div>
        </div>
      </div>
    </div>
  );
};

export default BottomUi;