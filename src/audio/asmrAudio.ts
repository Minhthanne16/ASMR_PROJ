import type { SquishyMaterialType, InteractionMode } from '../types';

class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;
  private foamNoiseBuffer: AudioBuffer | null = null;
  private lastSquishTime: number = 0;

  constructor() {
    // AudioContext is initialized lazily upon first user interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Soft rubbery saturation shaper (tanh curve) to give elastic warmth without digital clipping
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.createSoftRubberCurve(24) as any;
      this.distortionNode.oversample = '2x';
      this.distortionNode.connect(this.masterGain);

      // Generate a rich 3-second multi-textured foam air noise buffer
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 3;
      this.foamNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = this.foamNoiseBuffer.getChannelData(0);

      // Pink & Brown noise mix with micro-texture grains (mimics air escaping porous polyurethane cells)
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;

        // Subtle micro-grain modulation for foam porous crunch
        const grain = (Math.random() > 0.94 ? (Math.random() - 0.5) * 0.12 : 0);
        data[i] = pink + grain;
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  // Soft saturation curve for realistic rubber & silicone tactile response
  private createSoftRubberCurve(amount: number = 20): Float32Array {
    const k = amount;
    const n = 44100;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.04);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.04);
    }
  }

  /**
   * ÂM THANH BÓP SQUISHY CHÂN THẬT & ĐÀN HỒI (Elastic Squelch & Air Compression)
   */
  public playSquish(
    intensity: number = 0.6,
    mode: InteractionMode = 'squish',
    materialType: SquishyMaterialType = 'matte'
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || !this.distortionNode || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastSquishTime < 0.045) return;
    this.lastSquishTime = now;

    const clampedIntensity = Math.max(0.2, Math.min(1.0, intensity));

    // 1. TACTILE SURFACE TACK (Tiếng tiếp xúc dính êm nhẹ khi ngón tay ấn vào mút xốp)
    const tackOsc = this.ctx.createOscillator();
    const tackGain = this.ctx.createGain();
    tackOsc.type = 'triangle';
    tackOsc.frequency.setValueAtTime(650 + Math.random() * 80, now);
    tackOsc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    tackGain.gain.setValueAtTime(0.001, now);
    tackGain.gain.linearRampToValueAtTime(0.18 * clampedIntensity, now + 0.006);
    tackGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    tackOsc.connect(tackGain);
    tackGain.connect(this.masterGain);
    tackOsc.start(now);
    tackOsc.stop(now + 0.045);

    // 2. ELASTIC BODY TONE (Âm sắc nảy đàn hồi - Pitch swoop with elastic rebound inflection)
    // Đặc trưng của đồ đàn hồi: cao độ hạ sâu rồi nảy nhẹ lại trước khi tắt!
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    // Glossy jelly has higher bounce pitch, matte foam has warmer deeper thrum
    const isJelly = materialType === 'glossy';
    const isVelvet = materialType === 'velvet';

    bodyOsc.type = isJelly ? 'sine' : 'triangle';

    const basePitch = mode === 'poke' ? 360 : (isJelly ? 320 : 220);
    const startPitch = basePitch + clampedIntensity * 180 + (Math.random() * 30 - 15);
    const dropPitch = mode === 'poke' ? 130 : (isJelly ? 140 : 85);
    const bouncePitch = dropPitch + (isJelly ? 35 : 18); // Elastic rebound inflection!

    bodyOsc.frequency.setValueAtTime(startPitch, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(dropPitch, now + 0.07);
    bodyOsc.frequency.linearRampToValueAtTime(bouncePitch, now + 0.12);
    bodyOsc.frequency.exponentialRampToValueAtTime(dropPitch * 0.9, now + 0.22);

    bodyGain.gain.setValueAtTime(0.001, now);
    bodyGain.gain.linearRampToValueAtTime((isJelly ? 0.38 : 0.28) * clampedIntensity, now + 0.015);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + (isJelly ? 0.26 : 0.2));

    bodyOsc.connect(bodyGain);
    bodyGain.connect(this.distortionNode);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.28);

    // 3. POROUS FOAM AIR EXHAUST (Tiếng khí nén xì qua lỗ xốp mút nhớ khi bị bẹp)
    if (this.foamNoiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.foamNoiseBuffer;
      noiseSource.playbackRate.value = 0.9 + Math.random() * 0.3;

      // Resonant bandpass sweep: mimicks air whoosh through squishy pores
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = isJelly ? 'lowpass' : 'bandpass';
      const filterStart = mode === 'poke' ? 1400 : (isVelvet ? 850 : 1100);
      noiseFilter.frequency.setValueAtTime(filterStart + clampedIntensity * 500, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(320, now + 0.18);
      noiseFilter.Q.value = isJelly ? 3.8 : 2.4; // High resonance for squelchy jelly sound

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.42 * clampedIntensity, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.masterGain);

      noiseSource.start(now);
      noiseSource.stop(now + 0.26);
    }
  }

  /**
   * ÂM THANH NỞ PHỒNG TỪ TỪ (Slow-Rise Breath & Elastic Relaxation)
   */
  public playRelease(
    durationSec: number = 2.5,
    materialType: SquishyMaterialType = 'matte'
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.foamNoiseBuffer) return;

    const now = this.ctx.currentTime;
    const soundDuration = Math.min(2.4, Math.max(0.8, durationSec * 0.65));

    // 1. Breathy Inhale (Bọt xốp mút nhớ hút khí trở lại khi phồng to)
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.foamNoiseBuffer;
    noiseSource.playbackRate.value = 0.85 + Math.random() * 0.15;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(240, now);
    filter.frequency.exponentialRampToValueAtTime(materialType === 'glossy' ? 950 : 780, now + soundDuration);
    filter.Q.value = 1.4;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.16, now + soundDuration * 0.35);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + soundDuration + 0.05);

    // 2. Soft Elastic Recovery Tone (Âm thanh giải phóng sức căng cao su êm ái)
    const relaxOsc = this.ctx.createOscillator();
    const relaxGain = this.ctx.createGain();
    relaxOsc.type = 'sine';
    relaxOsc.frequency.setValueAtTime(75, now);
    relaxOsc.frequency.linearRampToValueAtTime(125, now + soundDuration * 0.4);

    relaxGain.gain.setValueAtTime(0.0001, now);
    relaxGain.gain.linearRampToValueAtTime(0.12, now + 0.06);
    relaxGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration * 0.5);

    relaxOsc.connect(relaxGain);
    relaxGain.connect(this.masterGain);
    relaxOsc.start(now);
    relaxOsc.stop(now + soundDuration * 0.55);
  }

  /**
   * ÂM THANH KÉO DÃN (Elastic Rubber Tension & Mochi Stretch)
   */
  public playStretch(tension: number = 0.5) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    // Rubber tension: rising pitch with subtle micro-vibrato
    const base = 260 + tension * 220 + (Math.random() * 20 - 10);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base + 80, now + 0.14);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.2 * tension, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * ÂM THANH BONG BÓNG POP (Vui nhộn khi click nút hoặc nảy tưng)
   */
  public playPop() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440 + Math.random() * 60, now);
    osc.frequency.exponentialRampToValueAtTime(960 + Math.random() * 80, now + 0.065);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Âm thanh chuông Zen ngân vang khi xả 100% stress
   */
  public playZenSound() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Chuỗi nốt êm dịu ngũ cung: F4, A4, C5, E5, G5
    const notes = [349.23, 440.0, 523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const noteStart = now + idx * 0.12;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.18, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 2.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 2.7);
    });
  }
}

export const asmrAudio = new ASMRSoundEngine();
