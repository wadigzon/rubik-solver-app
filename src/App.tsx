import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { RubiksCube } from './RubiksCube';
import { RubikState } from './cubeState';
import { Play, SkipForward, SkipBack, Copy, Shuffle, RotateCcw, Check, AlertCircle, Wand2, Loader2 } from 'lucide-react';

export default function App() {
  const [cube] = useState(() => new RubikState());
  const [stateString, setStateString] = useState(cube.asString());
  
  // Animation queue state
  const [moveQueue, setMoveQueue] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentMove, setCurrentMove] = useState<string | null>(null);

  // Custom String Import/Export
  const [kociembaStr, setKociembaStr] = useState(stateString);
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);

  // Notation input
  const [notationInput, setNotationInput] = useState('');
  const [lastShuffle, setLastShuffle] = useState('');
  const [shuffleCopied, setShuffleCopied] = useState(false);

  // Solver debug state
  const [solveSteps, setSolveSteps] = useState<string[]>([]);
  const [solveIndex, setSolveIndex] = useState(-1);

  // Camera Controls
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!controlsRef.current) return;
      
      const camera = controlsRef.current.object;
      const angle = 15 * (Math.PI / 180); // 15 degrees rotation per keystroke
      
      const spherical = new THREE.Spherical().setFromVector3(camera.position);

      switch(e.key) {
        case 'ArrowLeft':
          spherical.theta -= angle;
          break;
        case 'ArrowRight':
          spherical.theta += angle;
          break;
        case 'ArrowUp':
          spherical.phi = Math.max(0.1, spherical.phi - angle);
          break;
        case 'ArrowDown':
          spherical.phi = Math.min(Math.PI - 0.1, spherical.phi + angle);
          break;
        default:
          return;
      }

      spherical.makeSafe();
      camera.position.setFromSpherical(spherical);
      controlsRef.current.update();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update text box when cube state changes
  useEffect(() => {
    setKociembaStr(stateString);
  }, [stateString]);

  // Process the animation queue
  useEffect(() => {
    if (!isAnimating && moveQueue.length > 0) {
      const nextMove = moveQueue[0];
      setIsAnimating(true);
      setCurrentMove(nextMove);
    } else if (!isAnimating && moveQueue.length === 0) {
      setIsShuffling(false);
    }
  }, [moveQueue, isAnimating]);

  const handleAnimationComplete = () => {
    if (currentMove) {
      // Actually apply move to logic state
      cube.move(currentMove);
      setStateString(cube.asString());
      
      // Remove from queue
      setMoveQueue(prev => prev.slice(1));
      setCurrentMove(null);
      setIsAnimating(false);
    }
  };

  const enqueueMoves = (movesStr: string) => {
    if (!movesStr.trim()) return;
    const moves = movesStr.trim().split(/\s+/);
    setMoveQueue(prev => [...prev, ...moves]);
  };

  const handleShuffle = () => {
    setSolveSteps([]);
    setSolveIndex(-1);
    setImportError('');
    
    // Generate 20 random moves
    const allMoves = ['U', "U'", 'U2', 'D', "D'", 'D2', 'R', "R'", 'R2', 'L', "L'", 'L2', 'F', "F'", 'F2', 'B', "B'", 'B2'];
    const shuffleMoves: string[] = [];
    let lastAxis = '';
    
    for (let i = 0; i < 20; i++) {
      let move = '';
      let axis = '';
      do {
        move = allMoves[Math.floor(Math.random() * allMoves.length)];
        axis = move[0];
      } while (axis === lastAxis);
      shuffleMoves.push(move);
      lastAxis = axis;
    }
    
    const shuffleStr = shuffleMoves.join(' ');
    setLastShuffle(shuffleStr);
    setIsShuffling(true);
    enqueueMoves(shuffleStr);
  };

  const handleReset = () => {
    setIsResetting(true);
    setSolveSteps([]);
    setSolveIndex(-1);
    setMoveQueue([]);
    cube.reset();
    setStateString(cube.asString());
    setImportError('');
    setLastShuffle('');
    
    setTimeout(() => {
      setIsResetting(false);
    }, 500);
  };

  const handleSolve = () => {
    if (cube.isSolved()) return;
    try {
      const solutionStr = cube.solve();
      if (solutionStr) {
        const moves = solutionStr.split(' ');
        setSolveSteps(moves);
        setSolveIndex(-1);
      }
    } catch (e) {
      setImportError('Cube is in an unsolvable state.');
    }
  };

  const handleApplyNotation = () => {
    enqueueMoves(notationInput);
    setNotationInput('');
  };

  const handleImportString = () => {
    const s = kociembaStr.toUpperCase();
    if (RubikState.isValid(s)) {
      cube.setFromString(s);
      setStateString(cube.asString());
      setImportError('');
      setSolveSteps([]);
      setSolveIndex(-1);
    } else {
      setImportError('Invalid 54-character state string.');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(kociembaStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stepNext = () => {
    if (solveIndex < solveSteps.length - 1) {
      const move = solveSteps[solveIndex + 1];
      enqueueMoves(move);
      setSolveIndex(idx => idx + 1);
    }
  };

  const stepPrev = () => {
    if (solveIndex >= 0) {
      const move = solveSteps[solveIndex];
      // compute inverse move
      let inv = move;
      if (move.endsWith("'")) inv = move[0];
      else if (move.endsWith("2")) inv = move;
      else inv = move + "'";
      
      enqueueMoves(inv);
      setSolveIndex(idx => idx - 1);
    }
  };

  const playSolve = () => {
    if (solveIndex < solveSteps.length - 1) {
      const remaining = solveSteps.slice(solveIndex + 1);
      enqueueMoves(remaining.join(' '));
      setSolveIndex(solveSteps.length - 1);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: 'var(--bg-color)' }}>
      {/* 3D Canvas */}
      <Canvas camera={{ position: [4, 4, 6], fov: 45 }}>
        <ambientLight intensity={1} />
        <RubiksCube 
          stateString={stateString}
          isAnimating={isAnimating}
          animationMove={currentMove}
          onAnimationComplete={handleAnimationComplete}
        />
        <OrbitControls ref={controlsRef} enablePan={false} minDistance={4} maxDistance={12} />
      </Canvas>

      {/* UI Overlay */}
      <div style={{ position: 'absolute', top: 20, right: 20, width: 340, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Main Controls */}
        <div className="glass-panel" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button className="button-secondary" onClick={handleShuffle} disabled={isAnimating || isShuffling || isResetting}>
            {isShuffling ? <Loader2 size={18} className="animate-spin" /> : <Shuffle size={18} />} 
            {isShuffling ? 'Shuffling...' : 'Shuffle'}
          </button>
          <button className="button-secondary" onClick={handleReset} disabled={isAnimating || isShuffling || isResetting}>
            {isResetting ? <Loader2 size={18} className="animate-spin" /> : <RotateCcw size={18} />} 
            {isResetting ? 'Resetting...' : 'Reset'}
          </button>
          <button className="button-primary" onClick={handleSolve} disabled={isAnimating || isShuffling || isResetting || cube.isSolved()}>
            <Wand2 size={18} /> Solve
          </button>
        </div>

        {/* Solver Debugger */}
        {solveSteps.length > 0 && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Solution Steps ({solveIndex + 1}/{solveSteps.length})</div>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxHeight: 80, overflowY: 'auto', padding: '4px' }}>
              {solveSteps.map((m, i) => (
                <span key={i} style={{ 
                  padding: '2px 6px', 
                  borderRadius: 4, 
                  background: i === solveIndex ? 'var(--accent-color)' : i < solveIndex ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                  color: i === solveIndex ? '#000' : 'white',
                  fontSize: '0.85rem'
                }}>{m}</span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="button-secondary" style={{ flex: 1 }} onClick={stepPrev} disabled={solveIndex < 0 || isAnimating || isShuffling || isResetting}><SkipBack size={16} /></button>
              <button className="button-primary" style={{ flex: 2 }} onClick={playSolve} disabled={solveIndex >= solveSteps.length - 1 || isAnimating || isShuffling || isResetting}><Play size={16} /> Play All</button>
              <button className="button-secondary" style={{ flex: 1 }} onClick={stepNext} disabled={solveIndex >= solveSteps.length - 1 || isAnimating || isShuffling || isResetting}><SkipForward size={16} /></button>
            </div>
          </div>
        )}

        {/* Custom Move Input */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard Notation</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              className="input-field" 
              placeholder="e.g. R U R' U'" 
              value={notationInput}
              onChange={e => setNotationInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApplyNotation()}
              disabled={isAnimating || isShuffling || isResetting}
            />
            <button className="button-primary" onClick={handleApplyNotation} disabled={!notationInput || isAnimating || isShuffling || isResetting}>Apply</button>
          </div>
        </div>

        {/* Last Shuffle Sequence */}
        {lastShuffle && (
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Last Shuffle Sequence</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                className="input-field" 
                value={lastShuffle}
                readOnly
                style={{ flex: 1, textOverflow: 'ellipsis', fontSize: '0.8rem' }}
                disabled={isAnimating || isShuffling || isResetting}
              />
              <button 
                className="button-secondary" 
                onClick={() => {
                  navigator.clipboard.writeText(lastShuffle);
                  setShuffleCopied(true);
                  setTimeout(() => setShuffleCopied(false), 2000);
                }} 
                disabled={isAnimating || isShuffling || isResetting}
              >
                {shuffleCopied ? <Check size={16} color="#00ff00" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* State Import/Export */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Kociemba State (54-char)</div>
          <textarea 
            className="input-field" 
            style={{ resize: 'none', height: 60, fontSize: '0.8rem', wordBreak: 'break-all' }}
            value={kociembaStr}
            onChange={e => setKociembaStr(e.target.value)}
            disabled={isAnimating || isShuffling || isResetting}
          />
          {importError && (
            <div style={{ color: '#ff4d4f', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> {importError}
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="button-secondary" style={{ flex: 1 }} onClick={copyToClipboard} disabled={isAnimating || isShuffling || isResetting || !RubikState.isValid(kociembaStr.toUpperCase())}>
              {copied ? <Check size={16} color="#00ff00" /> : <Copy size={16} />} Copy
            </button>
            <button className="button-primary" style={{ flex: 1 }} onClick={handleImportString} disabled={isAnimating || isShuffling || isResetting || stateString === kociembaStr}>
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
