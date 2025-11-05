import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { useAudio } from '../hooks/useAudio';
import { usePronunciationScoring } from '../hooks/usePronunciationScoring';
import TopHud from './TopHud';
import BottomUi from './BottomUi';
import TowerStackScene from './TowerStackScene';
import SurveyModal from './SurveyModal';
import { InputType } from '../types/game';
import { supabase } from '../lib/supabaseClient';

interface GameContainerProps {
  userId: string | null;
  age: number | string | null;
  gameId: string | number | null;
  urlParams: Record<string, string>;
}

const GameContainer: React.FC<GameContainerProps> = ({ userId, age, gameId, urlParams }) => {
  const [gameSessionId, setGameSessionId] = useState<string | null>(null);
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const { gameState, handleInput, handlePronunciationResult, resetGame: originalResetGame, startGame: originalStartGame, triggerCollapse, handleBlockFall } = useGameState();

  // Wrapper to reset gameSessionId when starting new game
  const startGame = useCallback(() => {
    setGameSessionId(null);
    setIsWin(false);
    originalStartGame();
  }, [originalStartGame]);

  // Wrapper to reset gameSessionId when resetting
  const resetGame = useCallback(() => {
    setGameSessionId(null);
    setIsWin(false);
    originalResetGame();
  }, [originalResetGame]);
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

  // Track win condition (towerBlocks.length >= 10 when game over)
  useEffect(() => {
    if (gameState.isGameOver && gameState.towerBlocks.length >= 10) {
      setIsWin(true);
    }
  }, [gameState.isGameOver, gameState.towerBlocks.length]);

  // Create a game_session row only when game actually starts
  useEffect(() => {
    const createSession = async () => {
      if (!gameState.isGameStarted) return;
      if (gameSessionId) return; // Already have a session
      if (!userId) return; // Need userId to create session

      const numericAge = Number.isFinite(Number(age)) ? Number(age) : null;
      const numericGameId = Number.isFinite(Number(gameId)) ? Number(gameId) : null;

      const payload = {
        user_id: userId,
        age: numericAge,
        game_id: numericGameId,
        start_time: new Date().toISOString(),
        score: 0,
        profile_data: urlParams || {}
      };

      try {
        const { data, error } = await supabase
          .from('game_sessions')
          .insert(payload)
          .select('id')
          .single();

        if (error) {
          console.error('Failed to create game session:', error);
          return;
        }

        setGameSessionId(data?.id || null);
        console.log('Created game session:', data?.id);
      } catch (err) {
        console.error('Unexpected error creating game session:', err);
      }
    };

    createSession();
  }, [gameState.isGameStarted, userId, age, gameId, urlParams, gameSessionId]);

  // Open survey when game over ONLY if user hasn't completed survey for this game before
  useEffect(() => {
    const checkAndOpenSurvey = async () => {
      if (!gameState.isGameOver) {
        setIsSurveyOpen(false);
        return;
      }
      
      console.log('🔍 Checking survey display:', { gameState, gameSessionId, userId, gameId, score: gameState.score });
      
      try {
        const numericGameId = Number.isFinite(Number(gameId)) ? Number(gameId) : null;

        // If we know the user and game, check historical completion
        if (userId && numericGameId != null) {
          const { data: history, error: historyError } = await supabase
            .from('game_sessions')
            .select('id')
            .eq('user_id', userId)
            .eq('game_id', numericGameId)
            .eq('survey_completed', true)
            .limit(1);

          if (!historyError && Array.isArray(history) && history.length > 0) {
            console.log('❌ Survey already completed for this user and game. Not showing.');
            setIsSurveyOpen(false);
            return;
          }
        }

        // Fallback to current session's completion flag if available
        if (gameSessionId) {
          const { data, error } = await supabase
            .from('game_sessions')
            .select('survey_completed')
            .eq('id', gameSessionId)
            .single();
          if (!error && data) {
            const completed = Boolean(data?.survey_completed);
            console.log('📊 Current session survey_completed:', completed, 'Setting isSurveyOpen to:', !completed);
            setIsSurveyOpen(!completed);
            return;
          } else {
            console.log('⚠️ Could not fetch current session, will show survey');
          }
        } else {
          console.log('⚠️ No gameSessionId, will show survey');
        }

        // Default: show if we couldn't verify completion
        console.log('✅ Showing survey (default - no restrictions found)');
        setIsSurveyOpen(true);
      } catch (e) {
        console.error('⚠️ Error checking survey completion:', e);
        console.log('✅ Showing survey (fallback due to error)');
        setIsSurveyOpen(true);
      }
    };

    // Add small delay to ensure end_time update completes first
    const timer = setTimeout(() => {
      checkAndOpenSurvey();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [gameState.isGameOver, gameSessionId, userId, gameId, gameState.score]);

  // When game ends, update end_time and final score on the session
  useEffect(() => {
    const markEndTime = async () => {
      if (!gameState.isGameOver || !gameSessionId) return;
      try {
        await supabase
          .from('game_sessions')
          .update({ end_time: new Date().toISOString(), score: gameState.score })
          .eq('id', gameSessionId);
      } catch (e) {
        // noop
      }
    };
    markEndTime();
  }, [gameState.isGameOver, gameSessionId, gameState.score]);

  const handleCloseSurvey = useCallback(() => {
    setIsSurveyOpen(false);
  }, []);

  const handlePlayAgain = useCallback(() => {
    setIsSurveyOpen(false);
    setIsWin(false);
    resetGame();
  }, [resetGame]);

  const handleExitGame = useCallback(async () => {
    // Update game_sessions to mark that user exited via button
    if (gameSessionId) {
      try {
        await supabase
          .from('game_sessions')
          .update({ exited_via_button: true, end_time: new Date().toISOString(), score: gameState.score })
          .eq('id', gameSessionId);
      } catch (e) {
        console.error('Error updating exited_via_button:', e);
      }
    }
    // Redirect after updating
    window.location.href = 'https://robot-record-web.hacknao.edu.vn/games';
  }, [gameSessionId, gameState.score]);

  // Handle game over screen
  if (gameState.isGameOver) {
    const isWinCondition = isWin || gameState.towerBlocks.length >= 10;
    return (
      <>
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <button
            onClick={handleExitGame}
            style={{
              position: 'fixed',
              top: '16px',
              left: '16px',
              zIndex: 50,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              border: '1px solid #0ea5e9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            ← Thoát game
          </button>
          
          <h1 style={{ 
            fontSize: '48px', 
            marginBottom: '20px', 
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            fontFamily: 'Comic Sans MS, cursive'
          }}>
            {isWinCondition ? '🎉 Chúc mừng! 🎉' : '🎮 Kết thúc trò chơi! 🎮'}
          </h1>
        
        <div style={{ 
          fontSize: '24px', 
          marginBottom: '10px',
          fontFamily: 'Comic Sans MS, cursive'
        }}>
          🏆 Điểm cuối: <span style={{ color: '#f39c12' }}>{gameState.score}</span>
        </div>
        
        <div style={{ 
          fontSize: '20px', 
          marginBottom: '10px',
          fontFamily: 'Comic Sans MS, cursive'
        }}>
          🏗️ Khối đã xây: <span style={{ color: '#2ecc71' }}>{gameState.towerBlocks.length}</span>
          <span style={{ color: '#ccc' }}>/10</span>
        </div>
        
        <div style={{ 
          fontSize: '18px', 
          marginBottom: '30px',
          fontFamily: 'Comic Sans MS, cursive'
        }}>
          💥 Khối đã rơi: <span style={{ color: '#e74c3c' }}>{gameState.fallenBlocks}</span>
          <span style={{ color: '#ccc' }}>/5</span>
        </div>
        
        <div style={{ fontSize: '18px', marginBottom: '40px', color: '#ccc' }}>
          {gameState.feedbackText}
        </div>
        
        <button
          onClick={resetGame}
          style={{
            padding: '15px 30px',
            fontSize: '20px',
            background: 'linear-gradient(45deg, #e74c3c, #3498db)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
          }}
        >
          Chơi lại
        </button>
      </div>
      <SurveyModal
        isOpen={isSurveyOpen}
        onClose={handleCloseSurvey}
        onPlayAgain={handlePlayAgain}
        gameSessionId={gameSessionId}
        currentGameId={gameId}
        userId={userId}
        age={age}
        urlParams={urlParams}
      />
      </>
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
      
      {/* Exit button when playing */}
      {gameState.isGameStarted && !gameState.isGameOver && (
        <button
          onClick={handleExitGame}
          style={{
            position: 'fixed',
            top: '16px',
            left: '16px',
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 16px',
            border: '1px solid #0ea5e9',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'monospace'
          }}
        >
          ← Thoát game
        </button>
      )}

      {/* Start Screen Overlay */}
      {!gameState.isGameStarted && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(30, 30, 60, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          zIndex: 200,
          backdropFilter: 'blur(5px)'
        }}>
          <button
            onClick={handleExitGame}
            style={{
              position: 'fixed',
              top: '16px',
              left: '16px',
              zIndex: 250,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              color: 'white',
              padding: '8px 16px',
              border: '1px solid #0ea5e9',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          >
            ← Thoát game
          </button>
          <h1 style={{ 
            fontSize: '40px', 
            marginBottom: '20px',
            textShadow: '0 4px 8px rgba(0,0,0,0.3)',
            color: '#ffffff',
            fontFamily: 'Comic Sans MS, cursive'
          }}>
            🏗️ Tháp Xếp Từ Vựng 🏗️
          </h1>
          
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '30px', 
            textAlign: 'center', 
            maxWidth: '500px',
            fontFamily: 'Comic Sans MS, cursive'
          }}>
            Xây dựng tháp bằng cách phát âm từ chính xác! <br/>
            Nói rõ ràng vào micro của bạn nhé!
          </p>
          
          <div style={{ 
            fontSize: '16px', 
            color: '#fff', 
            textAlign: 'center',
            fontFamily: 'Comic Sans MS, cursive'
          }}>
            <div>Nói rõ ràng để được chấm điểm tự động </div>
            <div>Đạt 3 lần phát âm hoàn hảo để kích hoạt chế độ COMBO! </div>
            <div>Giữ tháp cân bằng hoặc nó sẽ đổ! </div>
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <span style={{ color: '#2ecc71' }}>≥70: Hoàn hảo 🌟</span> | 
              <span style={{ color: '#f39c12' }}> ≥40: Tạm được 👍</span> | 
              <span style={{ color: '#e74c3c' }}> &lt;40: Thất bại 😅</span>
            </div>
          </div>

          <button
            onClick={startGame}
            style={{
              marginTop: '30px',
              padding: '15px 30px',
              fontSize: '18px',
              background: 'linear-gradient(45deg, #e74c3c, #3498db)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
            }}
          >
            Bắt đầu
          </button>
        </div>
      )}
    </div>
  );
};

export default GameContainer;