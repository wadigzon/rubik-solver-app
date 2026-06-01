import Cube from './lib/cubejs/cube.js';
import './lib/cubejs/solve.js';

// Initialize the solver for cubejs
Cube.initSolver();

export class RubikState {
  private cube: any;

  constructor(stateString?: string) {
    if (stateString) {
      this.cube = Cube.fromString(stateString);
    } else {
      this.cube = new Cube(); // Solved state
    }
  }

  // Returns the 54-char string (Kociemba format)
  // Format is U1..U9, R1..R9, F1..F9, D1..D9, L1..L9, B1..B9
  public asString(): string {
    return this.cube.asString();
  }

  public clone(): RubikState {
    return new RubikState(this.asString());
  }

  public reset() {
    this.cube = new Cube();
  }

  public setFromString(stateString: string) {
    this.cube = Cube.fromString(stateString);
  }

  public isSolved(): boolean {
    return this.asString() === 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
  }

  // Accept a single move (e.g. U, U', U2) or a sequence separated by spaces
  public move(notation: string) {
    this.cube.move(notation);
  }

  public shuffle() {
    this.cube = Cube.random();
  }

  public solve(): string {
    if (this.isSolved()) return '';
    // Returns string of moves like "R2 U' R' U' R U R U R U' R"
    return this.cube.solve();
  }

  public static isValid(stateString: string): boolean {
    // Basic length validation
    if (stateString.length !== 54) return false;
    
    // Check characters
    const validChars = ['U', 'R', 'F', 'D', 'L', 'B'];
    const counts = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
    for (let char of stateString) {
      if (!validChars.includes(char)) return false;
      counts[char as keyof typeof counts]++;
    }
    
    // Each color must appear exactly 9 times
    for (let char of validChars) {
      if (counts[char as keyof typeof counts] !== 9) return false;
    }
    
    // Deeper validation by trying to parse it
    try {
      const c = Cube.fromString(stateString);
      // cubejs solve throws if the cube is in an invalid/unsolvable state
      c.solve();
      return true;
    } catch (e) {
      return false;
    }
  }
}
