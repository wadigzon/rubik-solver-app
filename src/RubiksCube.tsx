import { useRef, useMemo, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, MathUtils, Mesh, BoxGeometry } from 'three';
import { getCubieColors } from './utils/cubeMap';

interface RubiksCubeProps {
  stateString: string;
  isAnimating: boolean;
  animationMove: string | null;
  onAnimationComplete: () => void;
}

const CUBIE_SIZE = 1;
const SPACING = 1.05;

// Move definitions: axis, direction multiplier, and coordinate condition
const MOVES = {
  U: { axis: 'y', dir: -1, cond: (_x: number, y: number, _z: number) => y === 1 },
  'U\'': { axis: 'y', dir: 1, cond: (_x: number, y: number, _z: number) => y === 1 },
  U2: { axis: 'y', dir: -2, cond: (_x: number, y: number, _z: number) => y === 1 },
  D: { axis: 'y', dir: 1, cond: (_x: number, y: number, _z: number) => y === -1 },
  'D\'': { axis: 'y', dir: -1, cond: (_x: number, y: number, _z: number) => y === -1 },
  D2: { axis: 'y', dir: 2, cond: (_x: number, y: number, _z: number) => y === -1 },
  R: { axis: 'x', dir: -1, cond: (x: number, _y: number, _z: number) => x === 1 },
  'R\'': { axis: 'x', dir: 1, cond: (x: number, _y: number, _z: number) => x === 1 },
  R2: { axis: 'x', dir: -2, cond: (x: number, _y: number, _z: number) => x === 1 },
  L: { axis: 'x', dir: 1, cond: (x: number, _y: number, _z: number) => x === -1 },
  'L\'': { axis: 'x', dir: -1, cond: (x: number, _y: number, _z: number) => x === -1 },
  L2: { axis: 'x', dir: 2, cond: (x: number, _y: number, _z: number) => x === -1 },
  F: { axis: 'z', dir: -1, cond: (_x: number, _y: number, z: number) => z === 1 },
  'F\'': { axis: 'z', dir: 1, cond: (_x: number, _y: number, z: number) => z === 1 },
  F2: { axis: 'z', dir: -2, cond: (_x: number, _y: number, z: number) => z === 1 },
  B: { axis: 'z', dir: 1, cond: (_x: number, _y: number, z: number) => z === -1 },
  'B\'': { axis: 'z', dir: -1, cond: (_x: number, _y: number, z: number) => z === -1 },
  B2: { axis: 'z', dir: 2, cond: (_x: number, _y: number, z: number) => z === -1 },
};

export function RubiksCube({ stateString, isAnimating, animationMove, onAnimationComplete }: RubiksCubeProps) {
  const groupRef = useRef<Group>(null);
  const pivotRef = useRef<Group>(null);
  
  // Base colors for the 27 cubies. useMemo instantly synchronizes with stateString
  const cubies = useMemo(() => getCubieColors(stateString), [stateString]);

  // Animation state
  const animState = useRef({
    progress: 0,
    targetAngle: 0,
    axis: 'x',
    activeMeshes: [] as Mesh[],
  });

  useLayoutEffect(() => {
    // Synchronously resets physical rotation exactly when React updates the colors
    // This perfectly eliminates the 1-frame visual flicker.
    if (pivotRef.current && groupRef.current) {
      const children = [...pivotRef.current.children];
      children.forEach(child => {
        groupRef.current!.add(child);
      });
      pivotRef.current.rotation.set(0, 0, 0);
      animState.current.activeMeshes = [];
    }
  }, [stateString]);

  useEffect(() => {
    if (isAnimating && animationMove && groupRef.current && pivotRef.current) {
      // Start an animation
      const move = MOVES[animationMove as keyof typeof MOVES];
      if (!move) {
        // Unknown move, skip animation
        onAnimationComplete();
        return;
      }

      animState.current = {
        progress: 0,
        targetAngle: move.dir * (Math.PI / 2),
        axis: move.axis,
        activeMeshes: []
      };

      // Find children that match the condition
      const children = [...groupRef.current.children];
      children.forEach((child) => {
        if (child instanceof Mesh) {
          // child.userData contains its initial coordinate
          const [x, y, z] = child.userData.pos;
          if (move.cond(x, y, z)) {
            animState.current.activeMeshes.push(child);
            pivotRef.current!.add(child);
          }
        }
      });
    }
  }, [isAnimating, animationMove]);

  useFrame((_state, delta) => {
    if (isAnimating && pivotRef.current && animState.current.activeMeshes.length > 0) {
      if (animState.current.progress < 1.0) {
        const ANIM_SPEED = 5.0; // rad/s
        let step = ANIM_SPEED * delta;
        let newProgress = animState.current.progress + step;
        let finished = false;

        if (newProgress >= 1.0) {
          newProgress = 1.0;
          finished = true;
        }

        animState.current.progress = newProgress;
        const currentAngle = MathUtils.lerp(0, animState.current.targetAngle, newProgress);

        pivotRef.current.rotation.set(0, 0, 0);
        if (animState.current.axis === 'x') pivotRef.current.rotation.x = currentAngle;
        if (animState.current.axis === 'y') pivotRef.current.rotation.y = currentAngle;
        if (animState.current.axis === 'z') pivotRef.current.rotation.z = currentAngle;

        if (finished) {
          // Animation done. Trigger state update.
          // We DO NOT reset the physical rotation here. We leave it fully rotated
          // until the exact React layout phase where colors are swapped!
          onAnimationComplete();
        }
      }
    }
  });

  return (
    <group>
      <group ref={groupRef}>
        {cubies.map((cubie, idx) => {
          const [x, y, z] = cubie.position;
          return (
            <mesh
              key={idx}
              position={[x * SPACING, y * SPACING, z * SPACING]}
              userData={{ pos: [x, y, z] }}
            >
              <boxGeometry args={[CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE]} />
              {/* Materials mapping to: Right, Left, Top, Bottom, Front, Back */}
              {cubie.colors.map((color, i) => (
                <meshBasicMaterial key={i} attach={`material-${i}`} color={color} />
              ))}
              {/* Add a black outline using EdgesGeometry if desired, but box helper is easier */}
              <lineSegments>
                <edgesGeometry args={[new BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE)]} />
                <lineBasicMaterial color="#000000" linewidth={2} />
              </lineSegments>
            </mesh>
          );
        })}
      </group>
      {/* Pivot group for animating rotations */}
      <group ref={pivotRef} />
    </group>
  );
}
