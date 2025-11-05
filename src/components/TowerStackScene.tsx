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
        <meshStandardMaterial color="#4ade80" />
      </mesh>
      <CuboidCollider args={[10, 0.5, 10]} />
    </RigidBody>
  );
};

// Animated Sun component
const Sun: React.FC = () => {
  const sunRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[8, 12, -20]} ref={sunRef}>
      <mesh>
        <sphereGeometry args={[1.5]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      {/* Sun rays */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <mesh key={`ray-${i}`} position={[
          Math.cos(i * Math.PI / 4) * 2.5,
          Math.sin(i * Math.PI / 4) * 2.5,
          0
        ]} rotation={[0, 0, i * Math.PI / 4]}>
          <boxGeometry args={[0.1, 0.8, 0.1]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
};

// Background decorations
const BackgroundDecorations: React.FC = () => {
  return (
    <group>
      {/* Trees */}
      {[-8, -6, 6, 8].map((x, i) => (
        <group key={`tree-${i}`} position={[x, 0, -8]}>
          {/* Tree trunk */}
          <mesh position={[0, 1, 0]}>
            <cylinderGeometry args={[0.2, 0.3, 2]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
          {/* Tree leaves */}
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[1.2]} />
            <meshStandardMaterial color="#228b22" />
          </mesh>
        </group>
      ))}
      
      {/* Background buildings */}
      {[-12, -10, 10, 12].map((x, i) => (
        <group key={`building-${i}`} position={[x, 0, -12]}>
          <mesh position={[0, 3, 0]}>
            <boxGeometry args={[2, 6, 2]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#4ade80" : i % 3 === 1 ? "#ffd93d" : "#ff6b6b"} />
          </mesh>
          {/* Building windows */}
          {[1, 2, 3, 4].map((floor) => (
            <group key={`floor-${floor}`}>
              <mesh position={[-0.5, floor * 1.2 - 1, 1.01]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
              <mesh position={[0.5, floor * 1.2 - 1, 1.01]}>
                <planeGeometry args={[0.3, 0.3]} />
                <meshStandardMaterial color="#ffeb3b" />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      
      {/* Clouds */}
      {[-5, 0, 5].map((x, i) => (
        <group key={`cloud-${i}`} position={[x, 8 + i, -15]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.8]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.6, 0, 0]}>
            <sphereGeometry args={[0.6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.6, 0, 0]}>
            <sphereGeometry args={[0.6]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      
      {/* Sun */}
      <Sun />
    </group>
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

const ComboParticles: React.FC<{ isActive: boolean; towerHeight: number }> = ({ isActive, towerHeight }) => {
  const particlesRef = useRef<THREE.Group>(null);
  const [particles] = useState(() => 
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 4,
        towerHeight + Math.random() * 3,
        (Math.random() - 0.5) * 4
      ] as [number, number, number],
      velocity: [
        (Math.random() - 0.5) * 0.1,
        Math.random() * 0.1 + 0.05,
        (Math.random() - 0.5) * 0.1
      ] as [number, number, number],
      color: ['#4ade80', '#ffd93d', '#ff6b6b', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)]
    }))
  );

  useFrame(() => {
    if (isActive && particlesRef.current) {
      particles.forEach((particle, i) => {
        particle.position[0] += particle.velocity[0];
        particle.position[1] += particle.velocity[1];
        particle.position[2] += particle.velocity[2];
        
        // Reset particle if it goes too high
        if (particle.position[1] > towerHeight + 5) {
          particle.position[1] = towerHeight;
          particle.position[0] = (Math.random() - 0.5) * 4;
          particle.position[2] = (Math.random() - 0.5) * 4;
        }
      });
    }
  });

  if (!isActive) return null;

  return (
    <group ref={particlesRef}>
      {particles.map((particle) => (
        <mesh key={particle.id} position={particle.position}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial 
            color={particle.color} 
            emissive={particle.color} 
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
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
      style={{ background: 'linear-gradient(to bottom, #74b9ff 0%, #81ecec 30%, #fd79a8 100%)' }}
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

      {/* Colorful sky background */}
      <color attach="background" args={['#74b9ff']} />

      {/* Background Decorations */}
      <BackgroundDecorations />

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

      {/* Combo Particles Effect */}
      <ComboParticles isActive={gameState.isComboActive} towerHeight={towerHeight} />

      {/* Camera Controller */}
      <CameraController gameState={gameState} />

      {/* Scene Effects */}
      <SceneEffects screenShake={screenShake} setScreenShake={setScreenShake} />
    </Canvas>
  );
};

export default TowerStackScene;