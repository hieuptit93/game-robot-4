import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { GameState } from '../types/game';
import TowerBlock from './TowerBlock';

interface TowerStackSceneProps {
  gameState: GameState;
  onCollapse: () => void;
  onBlockFall: () => void;
}

const Ground: React.FC = () => {
  return (
    <RigidBody type="fixed" position={[0, -0.5, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <CuboidCollider args={[10, 0.5, 10]} />
    </RigidBody>
  );
};

// ComboAura đã được xóa tạm thời để debug camera

const CameraController: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  useFrame(({ camera }) => {
    // Cố định distance để không zoom out
    const cameraDistance = 12;

    // Tính toán dựa trên số blocks thực tế
    const numBlocks = gameState.towerBlocks.length;

    if (numBlocks === 0) {
      // Không có blocks, camera ở vị trí mặc định
      camera.position.lerp(new THREE.Vector3(cameraDistance, 3, 0), 0.03);
      camera.lookAt(0, 3, 0);
      return;
    }

    // Tính vị trí block trên cùng dựa trên logic tạo block trong useGameState
    // Block thứ N có Y = (N-1) * 3.0 + 1.5, center ở Y + 0.75 (blocks to hơn)
    const topBlockCenterY = (numBlocks - 1) * 3.0 + 1.5 + 0.75;

    // Logic thực tế: Camera chỉ di chuyển lên một chút, không quá cao
    // Với 15 blocks (top block Y ≈ 29), camera chỉ cần ở Y ≈ 15
    const cameraHeight = Math.max(3, numBlocks * 0.8 + 3);

    // Look at point thấp hơn camera để nhìn xuống tháp
    const lookAtHeight = Math.max(2, numBlocks * 0.9 + 1);

    // Set camera position với distance cố định
    camera.position.set(cameraDistance, cameraHeight, 0);
    camera.lookAt(0, lookAtHeight, 0);

    // Debug log với thông tin thực tế blocks
    console.log(`Blocks: ${numBlocks}, Top block Y: ${topBlockCenterY}, Camera Y: ${cameraHeight}, LookAt Y: ${lookAtHeight}`);
  });

  return null;
};

const SceneEffects: React.FC<{
  screenShake: number;
  setScreenShake: (value: number | ((prev: number) => number)) => void;
}> = ({ screenShake, setScreenShake }) => {
  const sceneRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (sceneRef.current && screenShake > 0) {
      sceneRef.current.position.x = (Math.random() - 0.5) * screenShake;
      sceneRef.current.position.y = (Math.random() - 0.5) * screenShake;
      sceneRef.current.position.z = (Math.random() - 0.5) * screenShake;
      setScreenShake(prev => Math.max(0, prev - 0.1));
    } else if (sceneRef.current) {
      sceneRef.current.position.set(0, 0, 0);
    }
  });

  return <group ref={sceneRef} />;
};

const TowerStackScene: React.FC<TowerStackSceneProps> = ({ gameState, onCollapse, onBlockFall }) => {
  const [screenShake, setScreenShake] = useState(0);
  const trackedBlocksRef = useRef<Set<string>>(new Set());

  const triggerScreenShake = (intensity: number = 0.5) => {
    setScreenShake(intensity);
  };

  const handleBlockFallWithTracking = (blockId: string) => {
    if (!trackedBlocksRef.current.has(blockId)) {
      trackedBlocksRef.current.add(blockId);
      console.log(`New block fell: ${blockId}, total fallen: ${trackedBlocksRef.current.size}`);
      // Chỉ gọi onBlockFall nếu block chưa được track
      onBlockFall();
    } else {
      console.log(`Block ${blockId} already tracked, ignoring`);
    }
  };

  const towerHeight = gameState.towerBlocks.length * 3.0;

  return (
    <Canvas
      shadows
      camera={{ position: [12, 3, 0], fov: 60 }} // Camera ở độ cao ban đầu
      style={{ background: 'linear-gradient(to bottom, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Additional lighting for combo mode */}
      {gameState.isComboActive && (
        <pointLight
          position={[0, towerHeight + 2, 0]}
          intensity={2}
          color="#ffaa00"
          distance={10}
        />
      )}

      {/* Simple background */}
      <color attach="background" args={['#1a1a2e']} />

      {/* Physics World */}
      <Physics gravity={[0, -9.81, 0]} debug={false}>
        {/* Ground */}
        <Ground />

        {/* Tower Blocks */}
        {gameState.towerBlocks.map((block, index) => (
          <TowerBlock
            key={block.id}
            block={block}
            index={index}
            isComboActive={gameState.isComboActive}
            onCollapse={() => {
              triggerScreenShake(1.0);
              setTimeout(onCollapse, 300);
            }}
            onBlockFall={() => {
              triggerScreenShake(0.3);
              handleBlockFallWithTracking(block.id);
            }}
          />
        ))}
      </Physics>

      {/* Combo Aura Effect - Tạm thời xóa để debug camera */}

      {/* Camera Controller */}
      <CameraController gameState={gameState} />

      {/* Scene Effects */}
      <SceneEffects screenShake={screenShake} setScreenShake={setScreenShake} />
    </Canvas>
  );
};

export default TowerStackScene;