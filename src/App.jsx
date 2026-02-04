import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Crosshair, Zap, Skull, Trophy, Play, RotateCcw, 
  Shield, AlertTriangle, Settings, Volume2, VolumeX, Save
} from 'lucide-react';

// --- SOUND ASSETS (Online Links for Instant Play) ---
const SOUNDS = {
  shoot: new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=laser-gun-shot-3-17208.mp3'),
  hit: new Audio('https://cdn.pixabay.com/download/audio/2021/08/09/audio_03057e50dc.mp3?filename=hit-sound-effect-12445.mp3'),
  miss: new Audio('https://cdn.pixabay.com/download/audio/2022/03/24/audio_731dc54b41.mp3?filename=error-126627.mp3'),
  levelup: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3'),
  gameover: new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=negative-beeps-6008.mp3')
};

const LEVELS = {
  1: { name: "ROOKIE", spawnRate: 1200, trapChance: 0, goldChance: 0.1, scoreReq: 1000 },
  2: { name: "SOLDIER", spawnRate: 1000, trapChance: 0.1, goldChance: 0.15, scoreReq: 2500 },
  3: { name: "ELITE", spawnRate: 800, trapChance: 0.2, goldChance: 0.2, scoreReq: 5000 },
  4: { name: "CYBER", spawnRate: 600, trapChance: 0.25, goldChance: 0.25, scoreReq: 8000 },
  5: { name: "GOD MODE", spawnRate: 450, trapChance: 0.4, goldChance: 0.3, scoreReq: Infinity }
};

const MAX_HEALTH = 100;

const App = () => {
  // --- STATE MANAGEMENT ---
  const [gameState, setGameState] = useState('menu'); 
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0); // Persistence
  const [health, setHealth] = useState(MAX_HEALTH);
  const [combo, setCombo] = useState(1);
  const [level, setLevel] = useState(1);
  const [targets, setTargets] = useState([]); 
  const [particles, setParticles] = useState([]); 
  const [hypeText, setHypeText] = useState(null);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [crosshairColor, setCrosshairColor] = useState('#06b6d4'); // Default Cyan

  const requestRef = useRef();
  const nextSpawnTime = useRef(0);
  const idCounter = useRef(0);

  // Load High Score on Mount
  useEffect(() => {
    const saved = localStorage.getItem('cyberaim_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  // Play Sound Helper
  const playSound = (type) => {
    if (volume > 0) {
      const sound = SOUNDS[type];
      if (sound) {
        sound.volume = volume;
        sound.currentTime = 0;
        sound.play().catch(e => console.log("Audio play failed", e));
      }
    }
  };

  // Hype Text
  const triggerHype = (text) => {
    setHypeText({ id: Date.now(), text });
    setTimeout(() => setHypeText(null), 800);
  };

  // --- GAME LOOP ---
  const gameLoop = useCallback((time) => {
    if (gameState !== 'playing' || showSettings) return;

    const currentLevelConfig = LEVELS[level];
    if (time > nextSpawnTime.current) {
      spawnTarget(currentLevelConfig);
      nextSpawnTime.current = time + currentLevelConfig.spawnRate;
    }
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, level, showSettings]);

  useEffect(() => {
    if (gameState === 'playing' && !showSettings) {
      requestRef.current = requestAnimationFrame(gameLoop);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [gameState, gameLoop, showSettings]);

  // Level Up
  useEffect(() => {
    if (gameState === 'playing' && level < 5) {
      if (score >= LEVELS[level].scoreReq) {
        setLevel(l => l + 1);
        triggerHype("LEVEL UP!");
        playSound('levelup');
        setHealth(Math.min(MAX_HEALTH, health + 20));
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      }
    }
  }, [score]);

  // Game Over Logic
  useEffect(() => {
    if (health <= 0 && gameState === 'playing') {
      setGameState('gameover');
      playSound('gameover');
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('cyberaim_highscore', score);
        triggerHype("NEW RECORD!");
      }
    }
  }, [health]);

  // --- CORE ACTIONS ---
  const startGame = () => {
    setScore(0);
    setHealth(MAX_HEALTH);
    setCombo(1);
    setLevel(1);
    setTargets([]);
    setParticles([]);
    setGameState('playing');
    playSound('levelup');
    triggerHype("START!");
  };

  const spawnTarget = (config) => {
    const id = idCounter.current++;
    const typeRoll = Math.random();
    let type = 'standard';
    let duration = 3000 - (level * 200);

    if (typeRoll < config.trapChance) { type = 'trap'; duration += 1000; }
    else if (typeRoll > (1 - config.goldChance)) { type = 'gold'; duration -= 500; }

    const x = Math.random() * 80 + 10;
    const y = Math.random() * 70 + 15;

    setTargets(prev => [...prev, { id, x, y, type, createdAt: Date.now(), duration }]);
  };

  // Target Expiry
  useEffect(() => {
    if (gameState !== 'playing' || showSettings) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setTargets(prev => {
        const remaining = [];
        let damage = 0;
        prev.forEach(t => {
          if (now - t.createdAt < t.duration) {
            remaining.push(t);
          } else {
            if (t.type !== 'trap') damage += 10; 
          }
        });
        
        if (damage > 0) {
          setHealth(h => Math.max(0, h - damage));
          setCombo(1);
          playSound('miss');
        }
        return remaining;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, showSettings]);

  // CLICK HANDLER
  const handleShot = (e, targetId, type) => {
    e.stopPropagation();
    spawnParticle(e.clientX, e.clientY, type);

    if (type === 'trap') {
      setHealth(h => Math.max(0, h - 30));
      setCombo(1);
      triggerHype("SYSTEM ERROR!");
      playSound('miss');
      document.body.classList.add('glitch-screen');
      setTimeout(() => document.body.classList.remove('glitch-screen'), 300);
    } else {
      playSound('hit');
      const basePoints = type === 'gold' ? 300 : 100;
      setScore(s => s + (basePoints * combo));
      setCombo(c => Math.min(c + 1, 10)); 
      setHealth(h => Math.min(MAX_HEALTH, h + 2));
      
      if (combo > 4 && Math.random() > 0.7) {
        const quotes = ["FASTER!", "UNREAL!", "GODLIKE!", "DONT BLINK!", "KEEP GOING!"];
        triggerHype(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    }
    setTargets(prev => prev.filter(t => t.id !== targetId));
  };

  const handleMissClick = (e) => {
    if (gameState !== 'playing' || showSettings) return;
    playSound('shoot'); // Just shoot sound if hitting empty space
    setHealth(h => Math.max(0, h - 5));
    setCombo(1);
    spawnParticle(e.clientX, e.clientY, 'miss');
  };

  const spawnParticle = (x, y, type) => {
    const id = Math.random();
    setParticles(prev => [...prev, { id, x, y, type }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 800);
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-[#050505] text-white font-mono select-none" 
      onClick={handleMissClick}
      style={{ cursor: `crosshair` }} // In real CSS we use custom cursor
    >
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className={`absolute inset-0 bg-red-500/10 pointer-events-none transition-opacity duration-300 ${health < 30 ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />

      {/* --- HUD --- */}
      {gameState === 'playing' && (
        <div className="absolute top-0 w-full p-4 z-40 flex justify-between items-end bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
          {/* Health */}
          <div className="w-1/3">
             <div className="text-xs text-gray-400 mb-1">SYSTEM HEALTH</div>
             <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/20 relative">
                <motion.div animate={{ width: `${health}%` }} className={`h-full ${health < 30 ? 'bg-red-500' : 'bg-cyan-500'}`} />
             </div>
          </div>

          {/* Level Info */}
          <div className="text-center">
             <div className="text-xs text-purple-400 font-bold tracking-widest mb-1">LEVEL {level}</div>
             <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{LEVELS[level].name}</h1>
          </div>

          {/* Score */}
          <div className="w-1/3 text-right">
             <div className="text-xs text-gray-400">HIGHSCORE: {highScore}</div>
             <div className="text-4xl font-black text-yellow-400">{score.toLocaleString()}</div>
             <div className="text-sm text-cyan-400 mt-1 font-bold">COMBO x{combo}</div>
          </div>
        </div>
      )}

      {/* SETTINGS BUTTON */}
      <button 
        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
      >
        <Settings size={24} />
      </button>

      {/* --- HYPE TEXT --- */}
      <AnimatePresence>
        {hypeText && (
          <motion.div
            key={hypeText.id}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none"
          >
            <h2 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 drop-shadow-[0_0_15px_rgba(255,255,0,0.5)]">
              {hypeText.text}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- GAME AREA --- */}
      <div className="relative w-full h-full">
        <AnimatePresence>
          {targets.map(t => (
            <motion.div
              key={t.id}
              initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              style={{ top: `${t.y}%`, left: `${t.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              onMouseDown={(e) => handleShot(e, t.id, t.type)}
            >
              <div className={`relative flex items-center justify-center cursor-pointer
                ${t.type === 'standard' ? 'w-20 h-20' : t.type === 'gold' ? 'w-16 h-16' : 'w-24 h-24'}
              `}>
                <svg className="absolute inset-0 w-full h-full rotate-[-90deg]">
                  <circle cx="50%" cy="50%" r="46%" fill="none" stroke={t.type === 'trap' ? '#ef4444' : t.type === 'gold' ? '#eab308' : crosshairColor} strokeWidth="3" strokeDasharray="100" strokeDashoffset="0">
                    <animate attributeName="stroke-dashoffset" from="0" to="100" dur={`${t.duration}ms`} fill="freeze" />
                  </circle>
                </svg>
                <div 
                  className={`w-[80%] h-[80%] rounded-full flex items-center justify-center border-2 shadow-[0_0_20px_currentColor] backdrop-blur-md transition-transform active:scale-95`}
                  style={{ 
                    backgroundColor: t.type === 'standard' ? `${crosshairColor}20` : undefined,
                    borderColor: t.type === 'standard' ? crosshairColor : undefined,
                    color: t.type === 'standard' ? crosshairColor : undefined
                  }}
                >
                  {t.type === 'trap' ? (
                    <div className="text-red-500 bg-red-500/20 border-red-500 w-full h-full rounded-full flex items-center justify-center border-2"><Skull /></div>
                  ) : t.type === 'gold' ? (
                    <div className="text-yellow-400 bg-yellow-400/20 border-yellow-400 w-full h-full rounded-full flex items-center justify-center border-2"><Zap /></div>
                  ) : (
                    <Crosshair />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Particles */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ scale: 0, opacity: 1 }} animate={{ scale: 2, opacity: 0 }}
            style={{ top: p.y, left: p.x }}
            className={`absolute pointer-events-none w-12 h-12 rounded-full border-2 -translate-x-1/2 -translate-y-1/2 z-30
              ${p.type === 'trap' ? 'border-red-500' : p.type === 'gold' ? 'border-yellow-400' : p.type === 'miss' ? 'border-gray-500' : `border-[${crosshairColor}]`}`}
          />
        ))}

        {/* --- SETTINGS MODAL --- */}
        {showSettings && (
           <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
              <div className="bg-[#0a0a0a] border border-white/20 p-8 rounded-2xl w-96 space-y-6">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Settings /> SETTINGS</h2>
                 
                 {/* Volume Control */}
                 <div>
                    <label className="text-sm text-gray-400 mb-2 block">MASTER VOLUME</label>
                    <div className="flex items-center gap-3">
                       <VolumeX size={16} className="text-gray-500" />
                       <input 
                          type="range" min="0" max="1" step="0.1" 
                          value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-full accent-cyan-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                       />
                       <Volume2 size={16} className="text-white" />
                    </div>
                 </div>

                 {/* Color Picker */}
                 <div>
                    <label className="text-sm text-gray-400 mb-2 block">CROSSHAIR THEME</label>
                    <div className="flex gap-2">
                       {['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'].map(color => (
                          <button 
                             key={color}
                             onClick={() => setCrosshairColor(color)}
                             className={`w-8 h-8 rounded-full border-2 ${crosshairColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                             style={{ backgroundColor: color }}
                          />
                       ))}
                    </div>
                 </div>

                 <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
                 >
                    <Save size={18} /> SAVE & CLOSE
                 </button>
              </div>
           </div>
        )}

        {/* --- MENU SCREENS --- */}
        {gameState !== 'playing' && !showSettings && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-4xl w-full p-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              <div className="space-y-6 text-center md:text-left">
                <div>
                  <h1 className="text-6xl font-black italic text-white mb-2 tracking-tighter">CYBER<span style={{color: crosshairColor}}>AIM</span></h1>
                  <p className="text-purple-400 font-bold tracking-widest">NEURAL REFLEX TRAINER</p>
                </div>

                {gameState === 'gameover' && (
                   <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                      <div className="text-gray-400 text-sm">MISSION REPORT</div>
                      <div className="text-5xl font-black text-yellow-400 my-2">{score.toLocaleString()}</div>
                      <div className="text-sm text-gray-300">BEST SCORE: <span className="text-green-400 font-bold">{highScore}</span></div>
                   </div>
                )}

                <button onClick={startGame} className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl rounded-xl shadow-[0_0_30px_rgba(8,145,178,0.4)] transition-all hover:scale-105 flex justify-center items-center gap-3">
                   {gameState === 'gameover' ? <RotateCcw /> : <Play />} 
                   {gameState === 'gameover' ? "RETRY MISSION" : "INITIATE PROTOCOL"}
                </button>
              </div>

              {/* Guide */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2"><Shield size={20} style={{color: crosshairColor}}/> MISSION BRIEFING</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-white/10" style={{borderColor: `${crosshairColor}40`}}>
                    <div className="w-10 h-10 rounded-full border flex items-center justify-center" style={{borderColor: crosshairColor, color: crosshairColor}}><Crosshair size={20}/></div>
                    <div>
                      <div className="font-bold" style={{color: crosshairColor}}>STANDARD TARGET</div>
                      <div className="text-xs text-gray-400">Shoot to survive. (+100 PTS)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-yellow-500/30">
                    <div className="w-10 h-10 rounded-full border border-yellow-400 flex items-center justify-center text-yellow-400"><Zap size={20}/></div>
                    <div>
                      <div className="font-bold text-yellow-400">GOLDEN DATA</div>
                      <div className="text-xs text-gray-400">Bonus points! (+300 PTS)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 bg-black/40 p-3 rounded-lg border border-red-500/30">
                    <div className="w-10 h-10 rounded-full border border-red-500 flex items-center justify-center text-red-500 animate-pulse"><Skull size={20}/></div>
                    <div>
                      <div className="font-bold text-red-500">CORRUPT NODE</div>
                      <div className="text-xs text-gray-400">DO NOT TOUCH! (-30 HP)</div>
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;