import React, { useState, useRef, useCallback, useEffect } from 'react';
import type {
  SquishyConfig,
  SquishyShape,
  InteractionMode,
  StressStats,
  BackgroundConfig
} from './types';
import { SHAPE_METADATA } from './three/squishyModels';
import { SquishyCanvas } from './components/SquishyCanvas';
import { StressBar } from './components/StressBar';
import { ShapeSelector } from './components/ShapeSelector';
import { CustomizerPanel } from './components/CustomizerPanel';
import { asmrAudio } from './audio/asmrAudio';

export const App: React.FC = () => {
  // Squishy Configuration State
  const [config, setConfig] = useState<SquishyConfig>({
    shape: 'tomato',
    color: SHAPE_METADATA.tomato.defaultColor,
    materialType: 'matte',
    expression: 'happy',
    recoverySpeed: 'slow',
    soundEnabled: true,
    soundVolume: 0.85,
    soundProfile: 'slow_rise_whisper'
  });

  // Interaction Mode State
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('squish');

  // Background Customization State
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    type: 'color',
    color: '#f7f5f0',
    imageUrl: null,
    blur: 0
  });

  // Stress Level and Gamification Stats
  const [stats, setStats] = useState<StressStats>({
    stressLevel: 100,
    totalSquishes: 0,
    comboCount: 0,
    maxCombo: 0,
    zenUnlocked: false
  });

  // References for Canvas Actions
  const resetRef = useRef<(() => void) | null>(null);
  const squeezeAllRef = useRef<(() => void) | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);

  // Reset Squishy Geometry
  const handleReset = useCallback(() => {
    if (resetRef.current) {
      resetRef.current();
    }
  }, []);

  // Squeeze All action
  const handleSqueezeAll = useCallback(() => {
    if (squeezeAllRef.current) {
      squeezeAllRef.current();
    }
  }, []);

  // Toggle Sound
  const handleToggleSound = useCallback(() => {
    setConfig((prev) => {
      const nextSound = !prev.soundEnabled;
      asmrAudio.setMuted(!nextSound);
      return { ...prev, soundEnabled: nextSound };
    });
  }, []);

  // Handle Squish Activity (Updates Stress, Combos, Audio seamlessly without modal interruptions)
  const handleSquishActivity = useCallback((intensity: number) => {
    setStats((prev) => {
      const stressReduction = Math.max(1.2, intensity * 3.5);
      const newStress = Math.max(0, prev.stressLevel - stressReduction);
      const newCombo = prev.comboCount + 1;
      const newTotal = prev.totalSquishes + 1;

      // Soft Zen sound chime when reaching 0 stress
      if (newStress === 0 && !prev.zenUnlocked) {
        asmrAudio.playZenSound();
      }

      return {
        stressLevel: newStress,
        totalSquishes: newTotal,
        comboCount: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        zenUnlocked: newStress === 0 ? true : prev.zenUnlocked
      };
    });

    // Reset combo timeout
    if (comboTimeoutRef.current) {
      window.clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = window.setTimeout(() => {
      setStats((prev) => ({ ...prev, comboCount: 0 }));
    }, 2500);
  }, []);

  // Keyboard Shortcuts for enhanced UX
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleSqueezeAll();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleSound();
      } else if (e.code === 'Digit1') {
        setInteractionMode('poke');
      } else if (e.code === 'Digit2') {
        setInteractionMode('squish');
      } else if (e.code === 'Digit3') {
        setInteractionMode('stretch');
      } else if (e.code === 'Digit4') {
        setInteractionMode('rotate');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSqueezeAll, handleReset, handleToggleSound]);

  // Handle Shape Selection
  const handleSelectShape = (newShape: SquishyShape) => {
    setConfig((prev) => ({
      ...prev,
      shape: newShape,
      color: SHAPE_METADATA[newShape].defaultColor
    }));
    asmrAudio.playPop();
  };

  // Update Config Partially
  const handleChangeConfig = (newConfig: Partial<SquishyConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Update Background Partially
  const handleChangeBackground = (newBg: Partial<BackgroundConfig>) => {
    setBackgroundConfig((prev) => ({ ...prev, ...newBg }));
  };

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden select-none bg-stone-100 touch-none">
      {/* Dynamic Background Layer */}
      <div
        className="absolute inset-0 z-0 transition-colors duration-300 pointer-events-none"
        style={{
          backgroundColor: backgroundConfig.type === 'color' ? backgroundConfig.color : undefined,
          backgroundImage:
            backgroundConfig.type === 'image' && backgroundConfig.imageUrl
              ? `url(${backgroundConfig.imageUrl})`
              : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: backgroundConfig.blur > 0 ? `blur(${backgroundConfig.blur}px)` : undefined,
          transform: backgroundConfig.blur > 0 ? 'scale(1.04)' : undefined,
        }}
      />

      {/* Subtle ambient lighting vignette overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-radial from-transparent via-transparent to-stone-900/10" />

      {/* Top Stress Bar & Brand (Clean, non-intrusive) */}
      <StressBar
        stats={stats}
        soundEnabled={config.soundEnabled}
        onToggleSound={handleToggleSound}
        onReset={handleReset}
        onSqueezeAll={handleSqueezeAll}
      />

      {/* 3D Interactive Canvas (Takes full screen, pure squishy interaction) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <SquishyCanvas
          config={config}
          interactionMode={interactionMode}
          onSquishActivity={handleSquishActivity}
          onResetRef={resetRef}
          onSqueezeAllRef={squeezeAllRef}
        />
      </div>

      {/* Right Customizer Panel (Collapsible drawer for mobile & desktop) */}
      <CustomizerPanel
        config={config}
        interactionMode={interactionMode}
        backgroundConfig={backgroundConfig}
        onChangeMode={setInteractionMode}
        onChangeConfig={handleChangeConfig}
        onChangeBackground={handleChangeBackground}
      />

      {/* Bottom Shape Carousel */}
      <ShapeSelector
        currentShape={config.shape}
        onSelectShape={handleSelectShape}
      />
    </main>
  );
};

export default App;
