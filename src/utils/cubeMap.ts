// The standard cube colors mapped from Kociemba face names
export const COLOR_MAP = {
  U: '#ffffff', // White
  R: '#c41e3a', // Red
  F: '#2bb63e', // Green
  D: '#ffd700', // Yellow
  L: '#ff6e00', // Orange
  B: '#276edb', // Blue
};

// Represents 27 cubies. Each cubie has a position [x,y,z] in [-1,0,1].
// We need to map the 54 facelets to the 6 faces of the 27 cubies.
// ThreeJS BoxGeometry faces: 
// 0: right (x+), 1: left (x-), 2: top (y+), 3: bottom (y-), 4: front (z+), 5: back (z-)

// This function takes a 54-character Kociemba string and returns the colors for each of the 27 cubies
// in the solved (identity) rotation.
export function getCubieColors(stateString: string) {
  // stateString length is 54. 
  // U: 0-8, R: 9-17, F: 18-26, D: 27-35, L: 36-44, B: 45-53
  const getCol = (idx: number) => COLOR_MAP[stateString[idx] as keyof typeof COLOR_MAP];

  const cubies: { position: [number, number, number], colors: string[] }[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // default color: black for internal faces
        const colors = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000'];
        
        // Right face (x = 1) -> R
        if (x === 1) {
          // R face index: 
          // U is y=1..-1, F is z=1..-1
          // R0: U(1), B(-1) -> (y=1, z=-1)
          // R1: U(1), Center(0) -> (y=1, z=0)
          // R2: U(1), F(1) -> (y=1, z=1)
          // R3: Center(0), B(-1) -> (y=0, z=-1)
          // R4: Center(0), Center(0) -> (y=0, z=0)
          // R5: Center(0), F(1) -> (y=0, z=1)
          // R6: D(-1), B(-1) -> (y=-1, z=-1)
          // R7: D(-1), Center(0) -> (y=-1, z=0)
          // R8: D(-1), F(1) -> (y=-1, z=1)
          const rRow = y === 1 ? 0 : y === 0 ? 1 : 2;
          const rCol = z === -1 ? 2 : z === 0 ? 1 : 0;
          colors[0] = getCol(9 + rRow * 3 + rCol);
        }
        
        // Left face (x = -1) -> L
        if (x === -1) {
          // L0: U(1), F(1) -> (y=1, z=1)
          // L1: U(1), Center(0) -> (y=1, z=0)
          // L2: U(1), B(-1) -> (y=1, z=-1)
          const lRow = y === 1 ? 0 : y === 0 ? 1 : 2;
          const lCol = z === 1 ? 2 : z === 0 ? 1 : 0;
          colors[1] = getCol(36 + lRow * 3 + lCol);
        }

        // Top face (y = 1) -> U
        if (y === 1) {
          // U0: B(-1), L(-1) -> (z=-1, x=-1)
          // U1: B(-1), C(0) -> (z=-1, x=0)
          // U2: B(-1), R(1) -> (z=-1, x=1)
          const uRow = z === -1 ? 0 : z === 0 ? 1 : 2;
          const uCol = x === -1 ? 0 : x === 0 ? 1 : 2;
          colors[2] = getCol(0 + uRow * 3 + uCol);
        }

        // Bottom face (y = -1) -> D
        if (y === -1) {
          // D0: F(1), L(-1) -> (z=1, x=-1)
          const dRow = z === 1 ? 0 : z === 0 ? 1 : 2;
          const dCol = x === -1 ? 0 : x === 0 ? 1 : 2;
          colors[3] = getCol(27 + dRow * 3 + dCol);
        }

        // Front face (z = 1) -> F
        if (z === 1) {
          // F0: U(1), L(-1) -> (y=1, x=-1)
          const fRow = y === 1 ? 0 : y === 0 ? 1 : 2;
          const fCol = x === -1 ? 0 : x === 0 ? 1 : 2;
          colors[4] = getCol(18 + fRow * 3 + fCol);
        }

        // Back face (z = -1) -> B
        if (z === -1) {
          // B0: U(1), R(1) -> (y=1, x=1)
          const bRow = y === 1 ? 0 : y === 0 ? 1 : 2;
          const bCol = x === 1 ? 0 : x === 0 ? 1 : 2;
          colors[5] = getCol(45 + bRow * 3 + bCol);
        }

        cubies.push({ position: [x, y, z], colors });
      }
    }
  }

  return cubies;
}
