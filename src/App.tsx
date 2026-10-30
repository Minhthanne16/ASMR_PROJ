import React, { useState, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
import { ZenCelebrationModal } from './components/ZenCelebrationModal';
import { asmrAudio } from './audio/asmrAudio';

const RELAXING_MESSAGES = [
  'Hít thở thật sâu, cảm nhận độ êm ái...',
  'Bóp nhẹ hoặc ấn lún tùy theo ý bạn~',
  'Mọi áp lực công việc đang tan biến dần!',
  'Tiếng xốp đàn hồi ASMR thật đã tai!',
  'Bạn đã làm việc chăm chỉ hôm nay rồi, nghỉ ngơi tí nhé!',
  'Chậm rãi ngắm squishy phồng từ từ trở lại...',
  'Thả lỏng đôi vai, nặn một cục squishy mềm mại!',
  'Gần đến trạng thái bình yên tuyệt đối rồi đó!'
];

export const App: React.FC = () => {
  // Squishy Configuration State
  const [config, setConfig] = useState<SquishyConfig>({
    shape: 'bun',
    color: SHAPE_METADATA.bun.defaultColor,
    materialType: 'matte',
    expression: 'happy',
    recoverySpeed: 'slow',
    soundEnabled: true,
    soundVolume: 0.85
  });

  // Interaction Mode State
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('squish');

  // Background Customization State
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig>({
    type: 'color',
    color: '#f4f0f9',
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

  const [moodMessage, setMoodMessage] = useState<string>(RELAXING_MESSAGES[0]);
  const [isZenModalOpen, setIsZenModalOpen] = useState<boolean>(false);

  // References for Canvas Actions
  const resetRef = useRef<(() => void) | null>(null);
  const squeezeAllRef = useRef<(() => void) | null>(null);
  const comboTimeoutRef = useRef<number | null>(null);

  // Handle Squish Activity (Updates Stress, Combos, Audio)
  const handleSquishActivity = useCallback((intensity: number) => {
    setStats((prev) => {
      // Reduce stress: harder squishes reduce more stress
      const stressReduction = Math.max(1.2, intensity * 3.5);
      const newStress = Math.max(0, prev.stressLevel - stressReduction);
      const newCombo = prev.comboCount + 1;
      const newTotal = prev.totalSquishes + 1;

      // Check for Zen state trigger
      if (newStress === 0 && !prev.zenUnlocked) {
        // Fire confetti celebration
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea']
        });
        asmrAudio.playZenSound();
        setIsZenModalOpen(true);
      }

      return {
        stressLevel: newStress,
        totalSquishes: newTotal,
        comboCount: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        zenUnlocked: newStress === 0 ? true : prev.zenUnlocked
      };
    });

    // Reset combo timeout (combo stays alive if squished within 2.5s)
    if (comboTimeoutRef.current) {
      window.clearTimeout(comboTimeoutRef.current);
    }
    comboTimeoutRef.current = window.setTimeout(() => {
      setStats((prev) => ({ ...prev, comboCount: 0 }));
    }, 2500);

    // Randomize relaxing quote occasionally
    if (Math.random() < 0.25) {
      const randomMsg = RELAXING_MESSAGES[Math.floor(Math.random() * RELAXING_MESSAGES.length)];
      setMoodMessage(randomMsg);
    }
  }, []);

  // Handle Shape Selection
  const handleSelectShape = (newShape: SquishyShape) => {
    setConfig((prev) => ({
      ...prev,
      shape: newShape,
      color: SHAPE_METADATA[newShape].defaultColor
    }));
    asmrAudio.playPop();
  };

  // Toggle Sound
  const handleToggleSound = () => {
    setConfig((prev) => {
      const nextSound = !prev.soundEnabled;
      asmrAudio.setMuted(!nextSound);
      return { ...prev, soundEnabled: nextSound };
    });
  };

  // Reset Squishy Geometry
  const handleReset = () => {
    if (resetRef.current) {
      resetRef.current();
    }
  };

  // Squeeze All action
  const handleSqueezeAll = () => {
    if (squeezeAllRef.current) {
      squeezeAllRef.current();
    }
  };

  // Restart Stress game
  const handleRestartStress = () => {
    setStats({
      stressLevel: 100,
      totalSquishes: 0,
      comboCount: 0,
      maxCombo: 0,
      zenUnlocked: false
    });
    setIsZenModalOpen(false);
    handleReset();
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
    <main className="relative w-screen h-screen overflow-hidden select-none">
      {/* Dynamic Background Layer */}
      <div
        className="absolute inset-0 z-0 transition-colors duration-300 pointer-events-none"
        style={{
          backgroundColor: backgroundConfig.type === 'color' ? backgroundConfig.color : undefined,
          backgroundImage: backgroundConfig.type === 'image' && backgroundConfig.imageUrl
            ? `url(${backgroundConfig.imageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: backgroundConfig.blur > 0 ? `blur(${backgroundConfig.blur}px)` : undefined,
          transform: backgroundConfig.blur > 0 ? 'scale(1.04)' : undefined,
        }}
      />

      {/* Subtle ambient lighting vignette overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-radial from-transparent via-transparent to-black/10" />

      {/* Top Stress Bar & Brand */}
      <StressBar
        stats={stats}
        soundEnabled={config.soundEnabled}
        onToggleSound={handleToggleSound}
        onReset={handleReset}
        onSqueezeAll={handleSqueezeAll}
        moodMessage={moodMessage}
      />

      {/* 3D Interactive Canvas */}
      <div className="absolute inset-0 w-full h-full z-0">
        <SquishyCanvas
          config={config}
          interactionMode={interactionMode}
          onSquishActivity={handleSquishActivity}
          onResetRef={resetRef}
          onSqueezeAllRef={squeezeAllRef}
        />
      </div>

      {/* Right Customizer Panel */}
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

      {/* Zen State Celebration Modal */}
      <ZenCelebrationModal
        isOpen={isZenModalOpen}
        onClose={() => setIsZenModalOpen(false)}
        onRestart={handleRestartStress}
        squishCount={stats.totalSquishes}
      />
    </main>
  );
};

export default App;
