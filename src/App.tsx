import React, { useState, useEffect } from 'react';
import GameContainer from './components/GameContainer';

interface UrlParams {
  [key: string]: string;
}

const App: React.FC = () => {
  const [urlParams, setUrlParams] = useState<UrlParams>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [age, setAge] = useState<number | string | null>(null);
  const [gameId, setGameId] = useState<string | number | null>(null);

  // Parse URL params once on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const all: UrlParams = {};
      params.forEach((value, key) => {
        all[key] = value;
      });
      // Extract dedicated fields
      const extractedUserId = all.user_id ?? all.userId ?? null;
      const extractedAgeRaw = all.age ?? null;
      const extractedGameId = all.game_id ?? all.gameId ?? null;

      if (extractedUserId != null) setUserId(extractedUserId);
      if (extractedGameId != null) setGameId(extractedGameId);
      if (extractedAgeRaw != null) {
        const n = Number(extractedAgeRaw);
        setAge(Number.isFinite(n) ? n : extractedAgeRaw);
      }

      // Remove extracted keys from general params
      const { user_id, userId: userIdKey, age: ageKey, game_id, gameId: gameIdKey, ...rest } = all;
      setUrlParams(rest);
    } catch (e) {
      // noop
    }
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <GameContainer 
        userId={userId}
        age={age}
        gameId={gameId}
        urlParams={urlParams}
      />
    </div>
  );
};

export default App;