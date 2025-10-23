import React from 'react';
import GameContainer from './components/GameContainer';

const App: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    }}>
      <GameContainer />
    </div>
  );
};

export default App;