import type { SquishyMaterialType, InteractionMode } from '../types';

class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
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
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Generate a high-definition 4-second multi-grain acoustic foam noise buffer
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 4;
      this.foamNoiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
      const left = this.foamNoiseBuffer.getChannelData(0);
      const right = this.foamNoiseBuffer.getChannelData(1);

      // Pink & Brown noise with microscopic acoustic pores (micro-crackle of polyurethane air cells)
      let b0L = 0, b1L = 0, b2L = 0, b3L = 0, b4L = 0, b5L = 0;
      let b0R = 0, b1R = 0, b2R = 0, b3R = 0, b4R = 0, b5R = 0;

      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;

        b0L = 0.99886 * b0L + whiteL * 0.0555179;
        b1L = 0.99332 * b1L + whiteL * 0.0750759;
        b2L = 0.96900 * b2L + whiteL * 0.1538520;
        b3L = 0.86650 * b3L + whiteL * 0.3104856;
        b4L = 0.55000 * b4L + whiteL * 0.5329522;
        b5L = -0.7616 * b5L - whiteL * 0.0168980;

        b0R = 0.99886 * b0R + whiteR * 0.0555179;
        b1R = 0.99332 * b1R + whiteR * 0.0750759;
        b2R = 0.96900 * b2R + whiteR * 0.1538520;
        b3R = 0.86650 * b3R + whiteR * 0.3104856;
        b4R = 0.55000 * b4R + whiteR * 0.5329522;
        b5R = -0.7616 * b5R - whiteR * 0.0168980;

        const pinkL = (b0L + b1L + b2L + b3L + b4L + b5L + whiteL * 0.5362) * 0.12;
        const pinkR = (b0R + b1R + b2R + b3R + b4R + b5R + whiteR * 0.5362) * 0.12;

        // ASMR micro-pore pops: gentle crunch when memory foam cells squeeze
        const grainL = Math.random() > 0.92 ? (Math.random() - 0.5) * 0.16 : 0;
        const grainR = Math.random() > 0.92 ? (Math.random() - 0.5) * 0.16 : 0;

        left[i] = pinkL + grainL;
        right[i] = pinkR + grainR;
      }
    } catch (e) {
      console.warn('Web Audio API error:', e);
    }
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
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.03);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03);
    }
  }

  private createPanner(pan: number = 0): StereoPannerNode | GainNode {
    if (!this.ctx) return {} as any;
    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      panner.connect(this.masterGain!);
      return panner;
    }
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain!);
    return gain;
  }

  /**
   * ÂM THANH BÓP SQUISHY CHÂN THẬT (ASMR Binaural Sponge Crunch & Pneumatic Squelch)
   * Lấy cảm hứng từ các video ASMR squishy: tiếng xốp nén êm tai, bọt khí xì ra dịu dàng.
   */
  public playSquish(
    intensity: number = 0.6,
    mode: InteractionMode = 'squish',
    materialType: SquishyMaterialType = 'matte',
    panX: number = 0
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastSquishTime < 0.04) return;
    this.lastSquishTime = now;

    const clampedIntensity = Math.max(0.15, Math.min(1.0, intensity));
    const panner = this.createPanner(panX);

    // 1. WARM SUB-BASS TACTILE THUD (Âm trầm êm ái khi lòng bàn tay ép vào khối xốp đặc)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    const subStartFreq = materialType === 'glossy' ? 120 : (mode === 'poke' ? 100 : 75);
    subOsc.frequency.setValueAtTime(subStartFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.35 * clampedIntensity, now + 0.012);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    subOsc.connect(subGain);
    subGain.connect(panner);
    subOsc.start(now);
    subOsc.stop(now + 0.14);

    // 2. ELASTIC SQUELCH / CRUNCH (Âm sắc nảy đàn hồi và tiếng xốp mút nhớ)
    const bodyOsc = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();

    const isJelly = materialType === 'glossy';
    bodyOsc.type = isJelly ? 'sine' : 'triangle';

    const basePitch = mode === 'poke' ? 280 : (isJelly ? 240 : 160);
    const startPitch = basePitch + clampedIntensity * 120 + (Math.random() * 20 - 10);
    const dropPitch = mode === 'poke' ? 110 : (isJelly ? 120 : 65);

    bodyOsc.frequency.setValueAtTime(startPitch, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(dropPitch, now + 0.09);

    bodyGain.gain.setValueAtTime(0.001, now);
    bodyGain.gain.linearRampToValueAtTime((isJelly ? 0.28 : 0.22) * clampedIntensity, now + 0.015);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(panner);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.2);

    // 3. AIR EXHAUST & POROUS FOAM HISSER (Tiếng khí nén xì êm qua các mao mạch bọt xốp)
    if (this.foamNoiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.foamNoiseBuffer;
      noiseSource.playbackRate.value = 0.95 + Math.random() * 0.2;

      // Filter: warm bandpass sweep
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      const filterFreq = mode === 'poke' ? 1200 : (isJelly ? 700 : 950);
      noiseFilter.frequency.setValueAtTime(filterFreq + clampedIntensity * 400, now);
      noiseFilter.frequency.exponentialRampToValueAtTime(260, now + 0.18);
      noiseFilter.Q.value = isJelly ? 2.5 : 1.6;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, now);
      noiseGain.gain.linearRampToValueAtTime(0.38 * clampedIntensity, now + 0.02);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(panner);

      noiseSource.start(now);
      noiseSource.stop(now + 0.24);
    }
  }

  /**
   * ÂM THANH NỞ PHỒNG TỪ TỪ (Slow-Rise Breath & Elastic Relaxation)
   * Âm thanh êm ru đặc trưng khi squishy từ từ hút không khí trở lại và trở về hình dạng cũ.
   */
  public playRelease(
    durationSec: number = 2.5,
    materialType: SquishyMaterialType = 'matte'
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.foamNoiseBuffer) return;

    const now = this.ctx.currentTime;
    const soundDuration = Math.min(2.2, Math.max(0.7, durationSec * 0.6));

    // Tiếng bọt xốp hít khí êm ái
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.foamNoiseBuffer;
    noiseSource.playbackRate.value = 0.9 + Math.random() * 0.15;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(220, now);
    filter.frequency.exponentialRampToValueAtTime(materialType === 'glossy' ? 820 : 640, now + soundDuration);
    filter.Q.value = 1.2;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.0001, now);
    noiseGain.gain.linearRampToValueAtTime(0.14, now + soundDuration * 0.35);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(now);
    noiseSource.stop(now + soundDuration + 0.05);
  }

  /**
   * ÂM THANH KÉO DÃN (Elastic Rubber Tension & Mochi Stretch)
   */
  public playStretch(tension: number = 0.5, panX: number = 0) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const panner = this.createPanner(panX);

    osc.type = 'sine';
    const base = 180 + tension * 160 + (Math.random() * 20 - 10);
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base + 60, now + 0.12);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18 * tension, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    osc.connect(gain);
    gain.connect(panner);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * ÂM THANH POP NHẸ / CHẠM GẦN
   */
  public playPop() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(740 + Math.random() * 60, now + 0.05);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * ÂM THANH RÊ CHUỘT / NUDGE XÚC GIÁC (Rất nhẹ khi lướt gần squishy)
   */
  public playHoverNudge(panX: number = 0) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.foamNoiseBuffer) return;

    const now = this.ctx.currentTime;
    if (now - this.lastSquishTime < 0.12) return;
    this.lastSquishTime = now;

    const panner = this.createPanner(panX);
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.foamNoiseBuffer;
    noise.playbackRate.value = 1.2;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    noise.start(now);
    noise.stop(now + 0.1);
  }

  public playZenSound() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [349.23, 440.0, 523.25, 659.25, 783.99];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const noteStart = now + idx * 0.12;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.16, noteStart + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 2.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 2.5);
    });
  }
}

export const asmrAudio = new ASMRSoundEngine();
