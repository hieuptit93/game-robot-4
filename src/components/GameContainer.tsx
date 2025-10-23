import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import TopHud from './TopHud';
import BottomUi from './BottomUi';
import TowerStackScene from './TowerStackScene';
import { InputType } from '../types/game';

const GameContainer: React.FC = () => {
  const { gameState, handleInput, handlePronunciationResult, resetGame, startGame, triggerCollapse, handleBlockFall } = useGameState();
  const { playSound } = useAudio();

  // Memoize the analysis callback to prevent recreation
  const onAnalysisComplete = useCallback((result: any) => {
    console.log('🎯 Pronunciation analysis completed:', result);
    if (result && result.total_score !== undefined) {
      // Convert score to 0-100 range (multiply by 100)
      const score = Math.round(result.total_score * 100);
      console.log('📊 Final score:', score);
      handlePronunciationResult(score);
    }
  }, [handlePronunciationResult]);

  // Memoize the pronunciation config to prevent recreation
  const pronunciationConfig = useMemo(() => ({
    mode: 'vad' as const,
    autoAnalyze: true,
    textToAnalyze: gameState.currentChunk,
    vadConfig: {
      silenceThreshold: -30,
      speechThreshold: -18,
      minSpeechDuration: 500,
      maxSilenceDuration: 1000,
      maxRecordingTime: 8000
    },
    enableLogging: true,
    onAnalysisComplete
  }), [gameState.currentChunk, onAnalysisComplete]);

  // Pronunciation scoring hook with VAD mode and auto-analysis
  const pronunciationHook = usePronunciationScoring(pronunciationConfig);

  // Simple state-based approach to avoid loops
  const shouldListen = gameState.isGameStarted && !gameState.isGameOver && !gameState.isWaitingForNext;
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (shouldListen) {
      console.log('🎤 Starting pronunciation listening for:', gameState.currentChunk);
      // Small delay to prevent rapid start/stop cycles
      timeoutId = setTimeout(() => {
        pronunciationHook.startListening();
      }, 100);
    } else {
      console.log('🛑 Stopping pronunciation listening');
      pronunciationHook.stopListening();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      pronunciationHook.stopListening();
    };
  }, [shouldListen, gameState.currentChunk]); // Remove pronunciationHook from deps to prevent loop

  // Play sounds based on pronunciation results
  useEffect(() => {
    if (gameState.fluencyLevel !== 'neutral') {
      switch (gameState.fluencyLevel) {
        case 'perfect':
          playSound('perfect');
          if (gameState.comboStreak >= 3) {
            setTimeout(() => playSound('combo'), 100);
          }
          break;
        case 'minor':
          playSound('minor');
          break;
        case 'failure':
          playSound('failure');
          break;
      }
    }
  }, [gameState.fluencyLevel, gameState.comboStreak, playSound]);

  const handleInputWithAudio = (inputType: InputType) => {
    handleInput(inputType);
    
    // Play appropriate sound
    switch (inputType) {
      case 'A':
        playSound('perfect');
        if (gameState.comboStreak >= 2) { // Will become 3 after handleInput
          setTimeout(() => playSound('combo'), 100);
        }
        break;
      case 'S':
        playSound('minor');
        break;
      case 'D':
        playSound('failure');
        break;
    }
  };

  const handleCollapse = () => {
    playSound('collapse');
    triggerCollapse();
  };

  // Handle game over screen
  if (gameState.isGameOver) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d1b69 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '48px', marginBottom: '20px', textShadow: '0 4px 8px rgba(0,0,0,0.5)' }}>
          Game Over!
        </h1>
        
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>
          Final Score: <span style={{ color: '#ffaa00' }}>{gameState.score}</span>
        </div>
        
        <div style={{ fontSize: '20px', marginBottom: '10px' }}>
          Blocks Built: <span style={{ color: '#00ff88' }}>{gameState.towerBlocks.length}</span>
          <span style={{ color: '#666' }}>/10</span>
        </div>
        
        <div style={{ fontSize: '18px', marginBottom: '30px' }}>
          Blocks Fallen: <span style={{ color: '#ff4444' }}>{gameState.fallenBlocks}</span>
          <span style={{ color: '#666' }}>/5</span>
        </div>
        
        <div style={{ fontSize: '18px', marginBottom: '40px', color: '#ccc' }}>
          {gameState.feedbackText}
        </div>
        
        <button
          onClick={resetGame}
          style={{
            padding: '15px 30px',
            fontSize: '20px',
            background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)';
          }}
        >
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* HUD Components */}
      <TopHud gameState={gameState} />
      <BottomUi gameState={gameState} onInput={handleInputWithAudio} pronunciationHook={pronunciationHook} />
      
      {/* 3D Scene */}
      <TowerStackScene 
        gameState={gameState} 
        onCollapse={handleCollapse}
        onBlockFall={handleBlockFall}
      />
      
      {/* Start Screen Overlay */}
      {!gameState.isGameStarted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          zIndex: 200,
          backdropFilter: 'blur(5px)'
        }}>
          <h1 style={{ 
            fontSize: '48px', 
            marginBottom: '20px',
            textShadow: '0 4px 8px rgba(0,0,0,0.5)',
            background: 'linear-gradient(45deg, #00ff88, #ffaa00)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Chunk Tower Stack
          </h1>
          
          <p style={{ fontSize: '20px', marginBottom: '30px', textAlign: 'center', maxWidth: '500px' }}>
            Build a tower by pronouncing words correctly!<br/>
            Say the words clearly into your microphone.
          </p>
          
          <div style={{ fontSize: '16px', color: '#ccc', textAlign: 'center' }}>
            <div>🎤 Speak clearly for automatic scoring</div>
            <div>🎯 Get 3 perfect pronunciations for COMBO mode!</div>
            <div>⚠️ Keep your tower balanced or it will collapse!</div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <span style={{ color: '#00ff88' }}>≥70: Perfect</span> | 
              <span style={{ color: '#ffaa00' }}> ≥40: Minor</span> | 
              <span style={{ color: '#ff4444' }}> &lt;40: Failure</span>
            </div>
          </div>

          <button
            onClick={startGame}
            style={{
              marginTop: '30px',
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(45deg, #00ff88, #00cc6a)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0, 255, 136, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 255, 136, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.3)';
            }}
          >
            🎤 Start Speaking Game
          </button>
        </div>
      )}
    </div>
  );
};

export default GameContainer;