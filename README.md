# Chunk Tower Stack - Pronunciation Training Game

A 3D pronunciation training game built with React, React Three Fiber, and Rapier physics engine. Players build a tower by "pronouncing" chunks of text, with different pronunciation qualities affecting the physics and stability of the blocks.

## 🎮 Game Features

### Core Gameplay
- **Pronunciation Simulation**: Press A (Perfect), S (Minor), or D (Failure) to simulate pronunciation quality
- **Physics-Based Tower Building**: Each block has realistic physics properties based on pronunciation quality
- **Combo System**: Get 3 perfect pronunciations in a row to activate combo mode with enhanced stability
- **Tower Collapse**: Poor pronunciation creates unstable blocks that can cause the entire tower to fall

### Visual & Audio Effects
- **3D Graphics**: Immersive 3D environment with dynamic lighting and shadows
- **Block Effects**: Different glow colors and physics properties for each pronunciation quality
- **Screen Shake**: Dramatic collapse effects with camera shake
- **Audio Feedback**: Procedural sound effects for each action type
- **Combo Aura**: Visual glow effect during combo mode

### UI Components
- **Top HUD**: Score, block count, timer, and combo indicator
- **Bottom UI**: Current chunk prompt, fluency bar, feedback text, and control instructions
- **Game Over Screen**: Final score display with restart option

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download the project files
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to play the game

## 🎯 How to Play

1. **Start**: Press any key (A, S, or D) to begin
2. **Build**: Use keyboard inputs to add blocks:
   - **A Key**: Perfect pronunciation (✅) - Stable, centered block (+100 points)
   - **S Key**: Minor issues (⚠️) - Slightly tilted block (+50 points)  
   - **D Key**: Poor pronunciation (❌) - Heavily tilted, offset block (+0 points)
3. **Combo**: Get 3 perfect pronunciations in a row for combo mode (+150 points per perfect block)
4. **Survive**: Keep your tower stable - if it tilts too much, it will collapse!
5. **Score**: Build as high as possible within the 2-minute time limit

## 🛠 Technical Architecture

### Technologies Used
- **React 18**: Component-based UI framework
- **TypeScript**: Type-safe development
- **React Three Fiber**: React renderer for Three.js
- **@react-three/rapier**: Physics engine integration
- **@react-three/drei**: Useful helpers for R3F

### Project Structure
```
src/
├── components/
│   ├── GameContainer.tsx     # Main game logic and state management
│   ├── TopHud.tsx           # Score, timer, combo display
│   ├── BottomUi.tsx         # Input controls and feedback
│   ├── TowerStackScene.tsx  # 3D scene setup and physics world
│   └── TowerBlock.tsx       # Individual block physics and rendering
├── hooks/
│   ├── useGameState.ts      # Game state management
│   └── useAudio.ts          # Audio effects system
├── types/
│   └── game.ts              # TypeScript type definitions
└── App.tsx                  # Root application component
```

### Key Features Implementation

#### Physics System
- Each block is a Rapier RigidBody with realistic collision detection
- Block stability affects tower integrity
- Rotation thresholds trigger collapse events

#### Audio System
- Procedural audio generation using Web Audio API
- Different tones for each pronunciation quality
- Combo and collapse sound effects

#### Visual Effects
- Dynamic camera that follows tower height
- Glow effects for new blocks
- Screen shake during collapse
- Combo aura lighting effects

## 🎨 Customization

### Adding New Chunks
Edit the `CHUNKS` array in `src/hooks/useGameState.ts`:
```typescript
const CHUNKS = [
  "Your custom phrase",
  "Another practice sentence",
  // Add more chunks here
];
```

### Adjusting Physics
Modify block properties in `src/components/TowerBlock.tsx`:
- Rotation angles for different pronunciation qualities
- Position offsets for failure blocks
- Stability thresholds

### Visual Styling
- Colors and effects can be modified in component style objects
- 3D lighting and materials in `TowerStackScene.tsx`
- UI styling in individual component files

## 📱 Browser Compatibility

- Modern browsers with WebGL support
- Chrome, Firefox, Safari, Edge (latest versions)
- Mobile browsers (with touch controls for A/S/D inputs)

## 🔧 Development

### Available Scripts
- `npm start`: Development server
- `npm build`: Production build
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

### Performance Notes
- Physics calculations are optimized for 60fps
- Block count affects performance (recommended max: ~20 blocks)
- Audio context is created on-demand to avoid browser restrictions

## 🎓 Educational Use

This game demonstrates:
- 3D physics simulation in web browsers
- React integration with Three.js
- Real-time audio generation
- Game state management patterns
- TypeScript in React applications

Perfect for learning modern web development with 3D graphics and physics!