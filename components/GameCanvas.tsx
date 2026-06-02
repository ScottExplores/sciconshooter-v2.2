import React, { useEffect, useRef } from 'react';
import { GameEngine } from '../services/gameLogic';
import { Stats, GameState, PowerupType } from '../types';

interface GameCanvasProps {
  setStats: (stats: Stats) => void;
  setGameState: (state: GameState) => void;
  stats: Stats;
  gameState: GameState;
  isTransmissionOpen?: boolean;
  purchasedPowerup?: { type: PowerupType; nonce: number } | null;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ setStats, setGameState, stats, gameState, isTransmissionOpen = false, purchasedPowerup = null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const handledPowerupNonceRef = useRef<number | null>(null);
  const activeTouchIdRef = useRef<number | null>(null);
  
  // Use a ref to track gameState inside the animation loop closure
  const gameStateRef = useRef(gameState);
  const isTransmissionOpenRef = useRef(isTransmissionOpen);

  // Sync the ref whenever the prop changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    isTransmissionOpenRef.current = isTransmissionOpen;
  }, [isTransmissionOpen]);

  useEffect(() => {
    if (!purchasedPowerup || !engineRef.current) return;
    if (handledPowerupNonceRef.current === purchasedPowerup.nonce) return;
    handledPowerupNonceRef.current = purchasedPowerup.nonce;

    engineRef.current.stats = {
      ...engineRef.current.stats,
      ...stats
    };
    if (stats.lives > engineRef.current.lives) {
      engineRef.current.lives = stats.lives;
    }

    engineRef.current.activatePowerup(purchasedPowerup.type, false);
    setStats({ ...engineRef.current.stats });
  }, [purchasedPowerup, setStats, stats]);

  // Sync Stats (specifically upgrades/coins modified by React UI) to Engine
  useEffect(() => {
    if (engineRef.current) {
        engineRef.current.stats = stats;
        
        // Fix: Explicitly sync lives if the UI has a higher value (e.g., bought Repair)
        if (stats.lives > engineRef.current.lives) {
            engineRef.current.lives = stats.lives;
        }
        
        // Also sync upgrades immediately
        if (engineRef.current.stats.upgrades !== stats.upgrades) {
            engineRef.current.stats.upgrades = stats.upgrades;
        }
    }
  }, [stats]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize Engine
    const engine = new GameEngine(stats);
    engineRef.current = engine;
    
    // Resize Handler
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      engine.resize(canvas.width, canvas.height);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    engine.init(canvas.width, canvas.height);

    // Input Handlers
    const keys: Record<string, boolean> = {};
    engine.handleInput(keys, null);

    const handleKeyDown = (e: KeyboardEvent) => { 
      keys[e.key] = true; 
    };
    
    const handleKeyUp = (e: KeyboardEvent) => { 
      keys[e.key] = false; 
    };
    
    const updateTouchTarget = (touch: Touch) => {
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
      engine.handleInput(keys, { x, y });
    };

    const findTrackedTouch = (touches: TouchList) => {
      if (activeTouchIdRef.current === null) return touches[0] || null;

      for (let index = 0; index < touches.length; index += 1) {
        if (touches[index].identifier === activeTouchIdRef.current) {
          return touches[index];
        }
      }

      return null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
      const touch = e.changedTouches[0] || e.touches[0];
      if (!touch) return;

      activeTouchIdRef.current = touch.identifier;
      updateTouchTarget(touch);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = findTrackedTouch(e.touches);
      if (!touch) return;

      if (e.cancelable) e.preventDefault();
      updateTouchTarget(touch);
    };
    
    const handleTouchEnd = () => {
      activeTouchIdRef.current = null;
      engine.handleInput(keys, null);
    };

    const handleTouchCancel = () => {
      activeTouchIdRef.current = null;
      engine.handleInput(keys, null);
    };

    const handleWindowBlur = () => {
      activeTouchIdRef.current = null;
      engine.handleInput(keys, null);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);
    window.addEventListener('blur', handleWindowBlur);

    // FPS Control
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    // Loop
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      
      const deltaTime = timestamp - lastTimeRef.current;

      // Only update if enough time has passed (cap at 60 FPS)
      if (deltaTime >= frameInterval) {
          lastTimeRef.current = timestamp - (deltaTime % frameInterval);

          // Use the REF current value to check state, avoiding stale closure issues
          if (gameStateRef.current === GameState.PLAYING && !isTransmissionOpenRef.current) {
            engine.update();
          }

          // Sync Stats to React for HUD every 30 logical frames (0.5s)
          if (engine.frameCount % 30 === 0) {
            setStats({ 
                ...engine.stats,
            });
          }

          // Check Game Over
          if (!engine.gameActive && engine.lives <= 0) {
            setGameState(GameState.GAMEOVER);
          }
      }

      // ALWAYS draw the game so it appears in the background (interpolate if needed, but simple draw is fine here)
      engine.draw(ctx);
      
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      // Cleanup: Stop loop and remove listeners
      if (engineRef.current) engineRef.current.gameActive = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      window.removeEventListener('blur', handleWindowBlur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute left-0 top-0 z-0 block h-full w-full"
      style={{ touchAction: 'none' }}
    />
  );
};

export default GameCanvas;
