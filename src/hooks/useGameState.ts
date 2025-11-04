import { useState, useCallback, useEffect } from 'react';
import { GameState, TowerBlock, InputType } from '../types/game';

const INITIAL_STATE: GameState = {
  score: 0,
  comboStreak: 0,
  isComboActive: false,
  timerValue: 120, // 2 minutes
  towerBlocks: [],
  fallenBlocks: 0,
  isGameOver: false,
  isGameStarted: false,
  currentChunk: "Xin chào",
  fluencyLevel: 'neutral',
  feedbackText: "Nói từ để bắt đầu xây dựng!",
  isWaitingForNext: false,
  currentChunkIndex: 0
};

const CHUNKS = [
  "Hello",
  "How are you?",
  "Nice to meet you",
  "What’s your name?",
  "I’m fine, thank you",
  "See you later",
  "Have a great day",
  "Take care",
  "Good morning",
  "Good night",
  "Where are you from?",
  "I’m from Vietnam",
  "Can you help me?",
  "Thank you very much",
  "You’re welcome",
  "I don’t understand",
  "Please speak slowly",
  "How much is this?",
  "I’m sorry",
  "Excuse me"
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  // Timer effect
  useEffect(() => {
    if (!gameState.isGameStarted || gameState.isGameOver) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timerValue <= 1) {
          // Game over: Hết thời gian mà chưa được 10 blocks
          const gameOverReason = prev.towerBlocks.length < 10 
            ? "Hết thời gian! Bạn cần ít nhất 10 khối để thắng! ⏰"
            : "Chúc mừng! Bạn đã xây được tháp vững chắc! 🎉";
          
          return { 
            ...prev, 
            timerValue: 0, 
            isGameOver: true,
            feedbackText: gameOverReason
          };
        }
        return { ...prev, timerValue: prev.timerValue - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isGameStarted, gameState.isGameOver]);

  // Combo timeout effect
  useEffect(() => {
    if (!gameState.isComboActive) return;

    const timeout = setTimeout(() => {
      setGameState(prev => ({ ...prev, isComboActive: false }));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [gameState.isComboActive]);

  const handlePronunciationResult = useCallback((score: number) => {
    if (gameState.isGameOver || gameState.isWaitingForNext) return;

    setGameState(prev => {
      if (!prev.isGameStarted) {
        return { ...prev, isGameStarted: true };
      }

      // Convert score to input type based on thresholds
      let inputType: InputType;
      let scoreIncrease = 0;
      let newComboStreak = prev.comboStreak;
      let newIsComboActive = prev.isComboActive;
      let fluencyLevel: GameState['fluencyLevel'] = 'neutral';
      let feedbackText = '';

      // Score thresholds: >=70 Perfect, >=40 Minor, <40 Failure
      if (score >= 70) {
        inputType = 'A';
        scoreIncrease = prev.isComboActive ? 150 : 100;
        newComboStreak = prev.comboStreak + 1;
        fluencyLevel = 'perfect';
        feedbackText = `Phát âm hoàn hảo! Điểm: ${score} ✅`;
        
        if (newComboStreak >= 3) {
          newIsComboActive = true;
          feedbackText = `COMBO KÍCH HOẠT! Điểm: ${score} 🔥`;
        }
      } else if (score >= 40) {
        inputType = 'S';
        scoreIncrease = 50;
        newComboStreak = 0;
        newIsComboActive = false;
        fluencyLevel = 'minor';
        feedbackText = `Cố gắng tốt! Điểm: ${score} ⚠️`;
      } else {
        inputType = 'D';
        scoreIncrease = 0;
        newComboStreak = 0;
        newIsComboActive = false;
        fluencyLevel = 'failure';
        feedbackText = `Thử lại! Điểm: ${score} ❌`;
      }

      // Calculate position for new block
      let blockX = 0;
      let blockZ = 0;
      
      // For perfect blocks, align exactly with the previous block
      if (inputType === 'A' && prev.towerBlocks.length > 0) {
        const lastBlock = prev.towerBlocks[prev.towerBlocks.length - 1];
        blockX = lastBlock.position[0];
        blockZ = lastBlock.position[2];
      }
      // For minor blocks, very slight offset
      else if (inputType === 'S') {
        blockX = (Math.random() - 0.5) * 0.1;
        blockZ = (Math.random() - 0.5) * 0.1;
      }
      // For failure blocks, large offset
      else if (inputType === 'D') {
        blockX = (Math.random() - 0.5) * 1.2;
        blockZ = (Math.random() - 0.5) * 1.2;
      }

      // Create new block
      const newBlock: TowerBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: inputType === 'A' ? 'perfect' : inputType === 'S' ? 'minor' : 'failure',
        position: [blockX, prev.towerBlocks.length * 3.0 + 1.5, blockZ],
        rotation: [0, 0, 0],
        color: inputType === 'A' ? '#00ff88' : inputType === 'S' ? '#ffaa00' : '#ff4444',
        glowColor: inputType === 'A' ? '#00ff88' : inputType === 'S' ? '#ffaa00' : '#ff4444'
      };

      // Move to next chunk
      const nextChunkIndex = (prev.currentChunkIndex + 1) % CHUNKS.length;
      const newChunk = CHUNKS[nextChunkIndex];

      return {
        ...prev,
        score: prev.score + scoreIncrease,
        comboStreak: newComboStreak,
        isComboActive: newIsComboActive,
        towerBlocks: [...prev.towerBlocks, newBlock],
        fluencyLevel,
        feedbackText,
        currentChunk: newChunk,
        currentChunkIndex: nextChunkIndex,
        isWaitingForNext: true // Set waiting state
      };
    });

    // Wait 3 seconds before allowing next word
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        isWaitingForNext: false,
        feedbackText: `Nói: "${prev.currentChunk}"`
      }));
    }, 3000);
  }, [gameState.isGameOver, gameState.isWaitingForNext]);

  const handleInput = useCallback((inputType: InputType) => {
    // Keep this for manual testing/fallback
    if (gameState.isGameOver) return;

    setGameState(prev => {
      if (!prev.isGameStarted) {
        return { ...prev, isGameStarted: true };
      }

      let scoreIncrease = 0;
      let newComboStreak = prev.comboStreak;
      let newIsComboActive = prev.isComboActive;
      let fluencyLevel: GameState['fluencyLevel'] = 'neutral';
      let feedbackText = '';

      // Calculate score and combo
      switch (inputType) {
        case 'A': // Perfect
          scoreIncrease = prev.isComboActive ? 150 : 100;
          newComboStreak = prev.comboStreak + 1;
          fluencyLevel = 'perfect';
          feedbackText = "Phát âm hoàn hảo! ✅";
          
          if (newComboStreak >= 3) {
            newIsComboActive = true;
            feedbackText = "COMBO KÍCH HOẠT! Nói trôi chảy! 🔥";
          }
          break;
          
        case 'S': // Minor
          scoreIncrease = 50;
          newComboStreak = 0;
          newIsComboActive = false;
          fluencyLevel = 'minor';
          feedbackText = "Cố gắng tốt! Tiếp tục luyện tập ⚠️";
          break;
          
        case 'D': // Failure
          scoreIncrease = 0;
          newComboStreak = 0;
          newIsComboActive = false;
          fluencyLevel = 'failure';
          feedbackText = "Thử lại! Tập trung vào độ rõ ràng ❌";
          break;
      }

      // Calculate position for new block
      let blockX = 0;
      let blockZ = 0;
      
      // For perfect blocks, align exactly with the previous block
      if (inputType === 'A' && prev.towerBlocks.length > 0) {
        const lastBlock = prev.towerBlocks[prev.towerBlocks.length - 1];
        blockX = lastBlock.position[0];
        blockZ = lastBlock.position[2];
      }
      // For minor blocks, very slight offset
      else if (inputType === 'S') {
        blockX = (Math.random() - 0.5) * 0.1;
        blockZ = (Math.random() - 0.5) * 0.1;
      }
      // For failure blocks, large offset
      else if (inputType === 'D') {
        blockX = (Math.random() - 0.5) * 1.2;
        blockZ = (Math.random() - 0.5) * 1.2;
      }

      // Create new block
      const newBlock: TowerBlock = {
        id: `block-${Date.now()}-${Math.random()}`,
        type: inputType === 'A' ? 'perfect' : inputType === 'S' ? 'minor' : 'failure',
        position: [blockX, prev.towerBlocks.length * 3.0 + 1.5, blockZ],
        rotation: [0, 0, 0],
        color: inputType === 'A' ? '#00ff88' : inputType === 'S' ? '#ffaa00' : '#ff4444',
        glowColor: inputType === 'A' ? '#00ff88' : inputType === 'S' ? '#ffaa00' : '#ff4444'
      };

      // Get new chunk
      const newChunk = CHUNKS[Math.floor(Math.random() * CHUNKS.length)];

      return {
        ...prev,
        score: prev.score + scoreIncrease,
        comboStreak: newComboStreak,
        isComboActive: newIsComboActive,
        towerBlocks: [...prev.towerBlocks, newBlock],
        fluencyLevel,
        feedbackText,
        currentChunk: newChunk
      };
    });
  }, [gameState.isGameOver]);

  const resetGame = useCallback(() => {
    setGameState(INITIAL_STATE);
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      isGameStarted: true,
      feedbackText: `Nói: "${prev.currentChunk}"`
    }));
  }, []);

  const triggerCollapse = useCallback(() => {
    console.log('Tower collapsed - triggerCollapse called');
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      feedbackText: "Tháp đổ rồi! Thử lại! 💥"
    }));
  }, []);

  const handleBlockFall = useCallback(() => {
    console.log('Block fell - handleBlockFall called');
    setGameState(prev => {
      const newFallenBlocks = prev.fallenBlocks + 1;
      console.log(`Fallen blocks: ${newFallenBlocks}/5`);
      
      // Game over nếu > 5 blocks bị rơi
      if (newFallenBlocks > 5) {
        console.log('Game over: Too many blocks fell');
        return {
          ...prev,
          fallenBlocks: newFallenBlocks,
          isGameOver: true,
          feedbackText: "Quá nhiều khối rơi! Kết thúc trò chơi! 💥"
        };
      }
      
      return {
        ...prev,
        fallenBlocks: newFallenBlocks,
        feedbackText: `Khối rơi! Còn ${5 - newFallenBlocks}/5 lần rơi ⚠️`
      };
    });
  }, []);

  return {
    gameState,
    handleInput,
    handlePronunciationResult,
    resetGame,
    startGame,
    triggerCollapse,
    handleBlockFall
  };
};