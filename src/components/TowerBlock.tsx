import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { TowerBlock as TowerBlockType } from '../types/game';

interface TowerBlockProps {
  block: TowerBlockType;
  index: number;
  isComboActive: boolean;
  onCollapse: () => void;
  onBlockFall: () => void;
}

const TowerBlock: React.FC<TowerBlockProps> = ({ block, index, isComboActive, onCollapse, onBlockFall }) => {
  const rigidBodyRef = useRef<any>();
  const meshRef = useRef<THREE.Mesh>(null);
  const [isGlowing, setIsGlowing] = useState(true);
  const hasFallenRef = useRef(false);
  const [rotationOffset] = useState<[number, number, number]>(() => {
    // Calculate rotation based on block type
    switch (block.type) {
      case 'perfect':
        return [0, 0, 0]; // Hoàn toàn thẳng
      case 'minor':
        return [
          (Math.random() - 0.5) * 0.05, // Giảm rotation xuống rất nhỏ
          0,
          (Math.random() - 0.5) * 0.05
        ];
      case 'failure':
        return [
          (Math.random() - 0.5) * 0.4, // Tăng rotation để rơi nhanh hơn
          0,
          (Math.random() - 0.5) * 0.4
        ];
      default:
        return [0, 0, 0];
    }
  });
  
  // Position offset đã được xử lý trong useGameState, không cần thêm offset ở đây
  const positionOffset: [number, number, number] = [0, 0, 0];

  // Glow effect duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsGlowing(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Animation and physics monitoring
  useFrame(() => {
    if (rigidBodyRef.current && meshRef.current) {
      // Check if block fell (multiple conditions)
      const position = rigidBodyRef.current.translation();
      const velocity = rigidBodyRef.current.linvel();
      const distanceFromCenter = Math.sqrt(position.x * position.x + position.z * position.z);
      
      // Block fell if:
      // 1. Below ground level, OR
      // 2. Far from center (> 1.5 units), OR  
      // 3. Low Y position with high horizontal velocity (sliding away)
      const fellCondition = position.y < -0.3 || 
                           distanceFromCenter > 1.5 || 
                           (position.y < 0.5 && Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z) > 3);
      
      if (fellCondition && !hasFallenRef.current) {
        console.log(`Block ${block.id} fell at Y: ${position.y}, distance: ${distanceFromCenter}, velocity: ${Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z)}`);
        hasFallenRef.current = true;
        onBlockFall();
        return;
      }
      
      // Check for severe instability (complete tower collapse) - DISABLED FOR NOW
      // const rotation = rigidBodyRef.current.rotation();
      // const rotationAngle = Math.abs(rotation.x) + Math.abs(rotation.z);
      
      // if (rotationAngle > 2.0 && !hasCollapsed) { // ~115 degrees - severe instability (almost upside down)
      //   console.log(`Block ${block.id} caused tower collapse with rotation: ${rotationAngle}`);
      //   setHasCollapsed(true);
      //   onCollapse();
      // }

      // Glow animation
      if (isGlowing && meshRef.current.material) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        const glowIntensity = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
        material.emissive.setHex(
          parseInt(block.glowColor.replace('#', ''), 16)
        );
        material.emissiveIntensity = glowIntensity * 0.3;
      } else if (meshRef.current.material) {
        const material = meshRef.current.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 0;
      }

      // Block stability enhancement (chỉ cho perfect và minor blocks)
      if (block.type === 'perfect' || block.type === 'minor') {
        const currentRotation = rigidBodyRef.current.rotation();
        const currentPosition = rigidBodyRef.current.translation();
        
        // Stabilize rotation (reduce any unwanted rotation)
        const stabilizationFactor = block.type === 'perfect' ? 0.9 : 0.95;
        const stabilizedRotation = {
          x: currentRotation.x * stabilizationFactor,
          y: currentRotation.y,
          z: currentRotation.z * stabilizationFactor,
          w: currentRotation.w
        };
        rigidBodyRef.current.setRotation(stabilizedRotation, true);
        
        // Keep blocks from drifting too far from intended position
        const maxDrift = block.type === 'perfect' ? 0.1 : 0.2;
        if (Math.abs(currentPosition.x - block.position[0]) > maxDrift || 
            Math.abs(currentPosition.z - block.position[2]) > maxDrift) {
          const pullFactor = block.type === 'perfect' ? 0.05 : 0.03;
          rigidBodyRef.current.setTranslation({
            x: currentPosition.x * (1 - pullFactor) + block.position[0] * pullFactor,
            y: currentPosition.y,
            z: currentPosition.z * (1 - pullFactor) + block.position[2] * pullFactor
          }, true);
        }
      }
      // Failure blocks không có stability enhancement - để chúng rơi tự nhiên
    }
  });

  const blockSize: [number, number, number] = [1.5, 1.5, 1.5]; // Hình lập phương to hơn 1.5 lần
  const initialPosition: [number, number, number] = [
    block.position[0] + positionOffset[0],
    block.position[1],
    block.position[2] + positionOffset[2]
  ];

  // Physics properties based on block type
  const physicsProps = {
    restitution: block.type === 'perfect' ? 0.0 : block.type === 'minor' ? 0.02 : 0.3, // Failure blocks bounce nhiều hơn
    friction: block.type === 'perfect' ? 1.0 : block.type === 'minor' ? 0.95 : 0.4,    // Failure blocks có friction thấp để trượt
  };

  return (
    <RigidBody
      ref={rigidBodyRef}
      position={initialPosition}
      rotation={rotationOffset}
      type="dynamic"
      colliders={false}
      restitution={physicsProps.restitution}
      friction={physicsProps.friction}
    >
      <mesh ref={meshRef} castShadow receiveShadow>
        <boxGeometry args={blockSize} />
        <meshStandardMaterial
          color={block.color}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>
      <CuboidCollider args={[blockSize[0] / 2, blockSize[1] / 2, blockSize[2] / 2]} />
      
      {/* Glow effect */}
      {isGlowing && (
        <mesh scale={[1.1, 1.1, 1.1]}>
          <boxGeometry args={blockSize} />
          <meshBasicMaterial
            color={block.glowColor}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </RigidBody>
  );
};

export default TowerBlock;