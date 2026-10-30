import type { SquishyMaterialType, InteractionMode, ASMRSoundProfile } from '../types';

/**
 * ASMR SOUND ENGINE
 * Chuyên biệt cho âm thanh:
 * 1. "Tiếng thở hút khí chậm rãi (Slow-Rise Whisper)" - shhhhhh... êm dịu cực chill
 * 2. "Giòn rụm lách tách (Crunchy ASMR)" - nano tape / wax crackle
 * 3. "Xốp mềm êm dịu (Soft Foam)" - memory foam cushion
 */
class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  // Pre-rendered acoustic buffers
  private whisperBreathBuffer: AudioBuffer | null = null;
  private crunchyNoiseBuffer: AudioBuffer | null = null;
  private softFleshBuffer: AudioBuffer | null = null;

  private lastSquishTime: number = 0;
  private lastTapTime: number = 0;

  constructor() {
    // Lazy initialization on first user interaction
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      const sampleRate = this.ctx.sampleRate;

      // 1. BUFFER 1: TIẾNG THỞ HÚT KHÍ CHẬM RÃI (Slow-Rise Whisper Buffer)
      // Thuật toán tạo luồng khí thở stereo siêu êm, lọc tần số gắt, giữ âm "shhhhh" mềm như nhung
      const whisperSec = 4.0;
      const whisperLen = Math.floor(sampleRate * whisperSec);
      this.whisperBreathBuffer = this.ctx.createBuffer(2, whisperLen, sampleRate);
      const wL = this.whisperBreathBuffer.getChannelData(0);
      const wR = this.whisperBreathBuffer.getChannelData(1);

      let bL = 0, bR = 0;
      let pL0 = 0, pL1 = 0, pL2 = 0;
      let pR0 = 0, pR1 = 0, pR2 = 0;

      for (let i = 0; i < whisperLen; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;

        // Smooth pink/brown noise filter (không có tiếng lách cách gắt)
        pL0 = 0.992 * pL0 + whiteL * 0.05;
        pL1 = 0.97 * pL1 + whiteL * 0.12;
        pL2 = 0.86 * pL2 + whiteL * 0.22;
        bL = (bL + 0.02 * whiteL) / 1.02;

        pR0 = 0.992 * pR0 + whiteR * 0.05;
        pR1 = 0.97 * pR1 + whiteR * 0.12;
        pR2 = 0.86 * pR2 + whiteR * 0.22;
        bR = (bR + 0.02 * whiteR) / 1.02;

        // Kết hợp luồng khí thở mịn màng
        wL[i] = (pL0 + pL1 + pL2) * 0.05 + bL * 0.35;
        wR[i] = (pR0 + pR1 + pR2) * 0.05 + bR * 0.35;
      }

      // 2. BUFFER 2: CRUNCHY NOISE BUFFER (Cho profile giòn rụm)
      const crunchSec = 3.5;
      const crunchLen = Math.floor(sampleRate * crunchSec);
      this.crunchyNoiseBuffer = this.ctx.createBuffer(2, crunchLen, sampleRate);
      const cL = this.crunchyNoiseBuffer.getChannelData(0);
      const cR = this.crunchyNoiseBuffer.getChannelData(1);

      for (let i = 0; i < crunchLen; i++) {
        const grainL = Math.random() > 0.89 ? (Math.random() - 0.5) * 0.4 : 0;
        const grainR = Math.random() > 0.89 ? (Math.random() - 0.5) * 0.4 : 0;
        cL[i] = wL[i % whisperLen] * 0.3 + grainL;
        cR[i] = wR[i % whisperLen] * 0.3 + grainR;
      }

      // 3. BUFFER 3: SOFT FLESH TAP (Tiếng chạm đầu ngón tay)
      const tapLen = Math.floor(sampleRate * 0.1);
      this.softFleshBuffer = this.ctx.createBuffer(1, tapLen, sampleRate);
      const tapData = this.softFleshBuffer.getChannelData(0);
      for (let i = 0; i < tapLen; i++) {
        const t = i / sampleRate;
        tapData[i] = Math.sin(2 * Math.PI * (70 - t * 150) * t) * Math.exp(-t * 60.0) * 0.35;
      }
    } catch (e) {
      console.warn('Web Audio init failed:', e);
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
      panner.pan.value = Math.max(-0.85, Math.min(0.85, pan));
      panner.connect(this.masterGain!);
      return panner;
    }
    const gain = this.ctx.createGain();
    gain.connect(this.masterGain!);
    return gain;
  }

  /**
   * 1. CHẠM ĐẦU NGÓN TAY ÊM DỊU (Soft Whispering Tap)
   */
  public playTap(intensity: number = 0.5, panX: number = 0) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.softFleshBuffer) return;

    const now = this.ctx.currentTime;
    if (now - this.lastTapTime < 0.07) return;
    this.lastTapTime = now;

    const panner = this.createPanner(panX);
    const source = this.ctx.createBufferSource();
    source.buffer = this.softFleshBuffer;
    source.playbackRate.value = 0.95 + Math.random() * 0.15;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.22 * intensity, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    source.connect(gain);
    gain.connect(panner);
    source.start(now);
  }

  /**
   * 2. TIẾNG BÓP NÉN / XẢ KHÍ MỀM MẠI (Porous Sponge Compression)
   */
  public playSquish(
    intensity: number = 0.6,
    mode: InteractionMode = 'squish',
    materialType: SquishyMaterialType = 'matte',
    panX: number = 0,
    soundProfile: ASMRSoundProfile = 'slow_rise_whisper'
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    if (now - this.lastSquishTime < 0.06) return;
    this.lastSquishTime = now;

    const clampedIntensity = Math.max(0.2, Math.min(1.0, intensity));
    const panner = this.createPanner(panX);

    // Chạm ngón tay êm
    this.playTap(clampedIntensity * 0.6, panX);

    const buffer =
      soundProfile === 'crunchy' && this.crunchyNoiseBuffer
        ? this.crunchyNoiseBuffer
        : this.whisperBreathBuffer;

    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = 0.95 + Math.random() * 0.15;
    const offset = Math.random() * 1.5;

    const filter = this.ctx.createBiquadFilter();

    if (soundProfile === 'crunchy') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.22);
      filter.Q.value = 1.6;
    } else {
      // Tiếng thở xả khí mút xốp (Soft Air Exhale)
      filter.type = 'bandpass';
      const center = materialType === 'glossy' ? 520 : (materialType === 'velvet' ? 380 : 440);
      filter.frequency.setValueAtTime(center + clampedIntensity * 200, now);
      filter.frequency.exponentialRampToValueAtTime(240, now + 0.24);
      filter.Q.value = 0.9;
    }

    const gain = this.ctx.createGain();
    const duration = mode === 'poke' ? 0.18 : 0.26;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(
      (soundProfile === 'crunchy' ? 0.45 : 0.38) * clampedIntensity,
      now + 0.02
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    source.start(now, offset, duration + 0.05);
  }

  /**
   * 3. 🌟 TIẾNG THỞ HÚT KHÍ CHẬM RÃI (SLOW-RISE WHISPER - shhhhhh...)
   * Trọng tâm chính: Khi thả tay ra, âm thanh hút khí êm dịu (shhhhhh...)
   * phát ra kéo dài khi squishy từ từ nở phồng to trở lại!
   */
  public playRelease(
    durationSec: number = 2.5,
    materialType: SquishyMaterialType = 'matte',
    _soundProfile: ASMRSoundProfile = 'slow_rise_whisper'
  ) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.whisperBreathBuffer) return;

    const now = this.ctx.currentTime;
    const soundDuration = Math.min(2.8, Math.max(1.0, durationSec * 0.75));

    // LỚP 1: LUỒNG KHÍ THỞ HÚT CHẬM (Smooth Whispering Breath Inhale - shhhhhh...)
    const breathSource = this.ctx.createBufferSource();
    breathSource.buffer = this.whisperBreathBuffer;
    breathSource.playbackRate.value = 0.92 + Math.random() * 0.12;
    const offset = Math.random() * 1.0;

    // Filter quét tần số mô phỏng tiếng thở bọt xốp hít khí
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq = 220;
    const peakFreq = materialType === 'glossy' ? 640 : (materialType === 'velvet' ? 460 : 540);

    filter.frequency.setValueAtTime(startFreq, now);
    // Tần số từ từ dâng lên khi bọt xốp nở rộng, rồi nhẹ nhàng lắng xuống
    filter.frequency.exponentialRampToValueAtTime(peakFreq, now + soundDuration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(260, now + soundDuration);
    filter.Q.value = 0.85; // Cực kỳ êm, không chói

    // Envelope âm lượng: Phồng từ từ, đạt đỉnh rồi tan biến êm ru
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    // Fade in êm ái
    gain.gain.linearRampToValueAtTime(0.28, now + soundDuration * 0.35);
    // Fade out từ từ theo độ phồng
    gain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration);

    breathSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    breathSource.start(now, offset, soundDuration + 0.05);

    // LỚP 2: SUB-SURFACE GENTLE AIR FLOW (Thì thầm khí nền tần số thấp)
    const subBreathSource = this.ctx.createBufferSource();
    subBreathSource.buffer = this.whisperBreathBuffer;
    subBreathSource.playbackRate.value = 0.75;

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(320, now);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.0001, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + soundDuration * 0.25);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + soundDuration * 0.85);

    subBreathSource.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.masterGain);

    subBreathSource.start(now, Math.random() * 1.5, soundDuration + 0.05);
  }

  /**
   * 4. TIẾNG KÉO DÃN DẺO (Smooth Mochi Stretch)
   */
  public playStretch(tension: number = 0.5, panX: number = 0) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.whisperBreathBuffer) return;

    const now = this.ctx.currentTime;
    const panner = this.createPanner(panX);

    const source = this.ctx.createBufferSource();
    source.buffer = this.whisperBreathBuffer;
    source.playbackRate.value = 0.85 + tension * 0.3;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420 + tension * 260, now);
    filter.Q.value = 1.0;

    const gain = this.ctx.createGain();
    const duration = 0.22;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.24 * tension, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    source.start(now, Math.random() * 1.5, duration + 0.05);
  }

  /**
   * 5. TIẾNG POP / SUCTION TÁCH DẺO
   */
  public playPop() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.whisperBreathBuffer) return;

    const now = this.ctx.currentTime;
    const source = this.ctx.createBufferSource();
    source.buffer = this.whisperBreathBuffer;
    source.playbackRate.value = 1.6 + Math.random() * 0.2;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(now, Math.random() * 1.5, 0.09);
  }

  /**
   * 6. TIẾNG RÊ CHUỘT LƯỚT QUA (Gentle Hover Whisper)
   */
  public playHoverNudge(panX: number = 0) {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted || !this.whisperBreathBuffer) return;

    const now = this.ctx.currentTime;
    const panner = this.createPanner(panX);

    const source = this.ctx.createBufferSource();
    source.buffer = this.whisperBreathBuffer;
    source.playbackRate.value = 1.05;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);

    source.start(now, Math.random() * 1.5, 0.14);
  }

  /**
   * 7. TIẾNG CHUÔNG ZEN THƯ THÁI
   */
  public playZenSound() {
    this.resume();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);

      const noteStart = now + idx * 0.15;
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 3.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(noteStart);
      osc.stop(noteStart + 3.1);
    });
  }
}

export const asmrAudio = new ASMRSoundEngine();
