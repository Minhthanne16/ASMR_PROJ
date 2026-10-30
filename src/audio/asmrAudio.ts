import type { SquishyMaterialType, InteractionMode, ASMRSoundProfile } from '../types';

/**
 * ASMR SOUND ENGINE - MULTI-LAYERED ACOUSTIC EXPERIENCE
 * Kết hợp hoàn hảo:
 * 1. LỚP ĐỆM XỐP ÊM RU BÊN DƯỚI (Cushion Body):
 *    m trầm ấm của khối xốp dày được nén chặt dưới lòng bàn tay, mang lại chiều sâu và độ nảy xúc giác.
 * 2. TIẾNG THỞ HÚT KHÍ CHẬM RÃI (Slow-Rise Whisper):
 *    Khi thả tay, luồng khí thở êm dịu (shhhhhh...) từ từ hút vào các vi bọt xốp khi squishy phồng to trở lại.
 * 3. HẠT VI KHÍ LÁCH TÁCH & KHÍ THỞ (Micro-Pore & Air Flow):
 *    Tùy chọn phong cách giòn rụm (Crunchy) hoặc thở êm ru (Whisper).
 */
class ASMRSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.85;

  // Pre-rendered acoustic buffers
  private whisperBreathBuffer: AudioBuffer | null = null;
  private crunchyNoiseBuffer: AudioBuffer | null = null;
  private cushionBodyBuffer: AudioBuffer | null = null;
  private softTapBuffer: AudioBuffer | null = null;

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

      // 1. BUFFER 1: TIẾNG THỞ HÚT KHÍ CHẬM RÃI (Slow-Rise Whisper - shhhhh...)
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

        pL0 = 0.992 * pL0 + whiteL * 0.05;
        pL1 = 0.97 * pL1 + whiteL * 0.12;
        pL2 = 0.86 * pL2 + whiteL * 0.22;
        bL = (bL + 0.02 * whiteL) / 1.02;

        pR0 = 0.992 * pR0 + whiteR * 0.05;
        pR1 = 0.97 * pR1 + whiteR * 0.12;
        pR2 = 0.86 * pR2 + whiteR * 0.22;
        bR = (bR + 0.02 * whiteR) / 1.02;

        wL[i] = (pL0 + pL1 + pL2) * 0.05 + bL * 0.35;
        wR[i] = (pR0 + pR1 + pR2) * 0.05 + bR * 0.35;
      }

      // 2. BUFFER 2: LỚP ĐỆM XỐP ÊM RU BÊN DƯỚI (CUSHION BODY BUFFER)
      // Tạo âm trầm cộng hưởng xúc giác của khối xốp polyurethane dày đặc (80Hz - 220Hz)
      const cushionSec = 2.5;
      const cushionLen = Math.floor(sampleRate * cushionSec);
      this.cushionBodyBuffer = this.ctx.createBuffer(2, cushionLen, sampleRate);
      const cBodyL = this.cushionBodyBuffer.getChannelData(0);
      const cBodyR = this.cushionBodyBuffer.getChannelData(1);

      let brownLowL = 0, brownLowR = 0;
      for (let i = 0; i < cushionLen; i++) {
        const w1 = Math.random() * 2 - 1;
        const w2 = Math.random() * 2 - 1;
        brownLowL = (brownLowL + 0.04 * w1) / 1.04;
        brownLowR = (brownLowR + 0.04 * w2) / 1.04;

        // m trầm mềm mại, có chiều sâu cơ học như nén đệm mút cao su
        cBodyL[i] = brownLowL * 0.75;
        cBodyR[i] = brownLowR * 0.75;
      }

      // 3. BUFFER 3: CRUNCHY NOISE BUFFER (Cho hiệu ứng giòn rụm lách tách)
      const crunchSec = 3.5;
      const crunchLen = Math.floor(sampleRate * crunchSec);
      this.crunchyNoiseBuffer = this.ctx.createBuffer(2, crunchLen, sampleRate);
      const cL = this.crunchyNoiseBuffer.getChannelData(0);
      const cR = this.crunchyNoiseBuffer.getChannelData(1);

      for (let i = 0; i < crunchLen; i++) {
        const grainL = Math.random() > 0.89 ? (Math.random() - 0.5) * 0.45 : 0;
        const grainR = Math.random() > 0.89 ? (Math.random() - 0.5) * 0.45 : 0;
        cL[i] = wL[i % whisperLen] * 0.25 + grainL;
        cR[i] = wR[i % whisperLen] * 0.25 + grainR;
      }

      // 4. BUFFER 4: SOFT FINGERTIP TAP
      const tapLen = Math.floor(sampleRate * 0.1);
      this.softTapBuffer = this.ctx.createBuffer(1, tapLen, sampleRate);
      const tapData = this.softTapBuffer.getChannelData(0);
      for (let i = 0; i < tapLen; i++) {
        const t = i / sampleRate;
        tapData[i] = Math.sin(2 * Math.PI * (70 - t * 150) * t) * Math.exp(-t * 60.0) * 0.35;
      }
    } catch (e) {
      console.warn('Web Audio ASMR engine init failed:', e);
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
    if (!this.ctx || !this.masterGain || this.isMuted || !this.softTapBuffer) return;

    const now = this.ctx.currentTime;
    if (now - this.lastTapTime < 0.07) return;
    this.lastTapTime = now;

    const panner = this.createPanner(panX);
    const source = this.ctx.createBufferSource();
    source.buffer = this.softTapBuffer;
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
   * 2. BÓP NÉN ĐA TẦNG (Cushion Body + Surface Crunch/Whisper)
   * KẾT HỢP ĐỒNG THỜI:
   * - Lớp đệm xốp êm ru bên dưới (Cushion Body): mang lại độ trầm ấm, chiều sâu và độ nảy
   * - Lớp bề mặt (Crunchy crackle hoặc Smooth air exhale)
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
    if (now - this.lastSquishTime < 0.055) return;
    this.lastSquishTime = now;

    const clampedIntensity = Math.max(0.25, Math.min(1.0, intensity));
    const panner = this.createPanner(panX);

    // Tiếng chạm ngón tay êm
    this.playTap(clampedIntensity * 0.5, panX);

    // 🌟 LỚP 1: LỚP ĐỆM XỐP ÊM RU BÊN DƯỚI (CUSHION BODY - ĐỘ NẢY & CHIỀU SÂU XÚC GIÁC)
    // Tái hiện âm trầm của khối xốp dày được nén dưới lòng bàn tay
    if (this.cushionBodyBuffer) {
      const cushionSource = this.ctx.createBufferSource();
      cushionSource.buffer = this.cushionBodyBuffer;
      cushionSource.playbackRate.value = 0.85 + Math.random() * 0.15;
      const cushionOffset = Math.random() * 1.0;

      const cushionFilter = this.ctx.createBiquadFilter();
      cushionFilter.type = 'lowpass';
      // Tần số trầm ấm tạo cảm giác nén khối xốp đặc
      cushionFilter.frequency.setValueAtTime(260 + clampedIntensity * 120, now);
      cushionFilter.frequency.exponentialRampToValueAtTime(110, now + 0.25);
      cushionFilter.Q.value = 1.2;

      const cushionGain = this.ctx.createGain();
      const cushionDuration = mode === 'poke' ? 0.2 : 0.32;
      cushionGain.gain.setValueAtTime(0.0001, now);
      // Nén êm ái, đầm tay
      cushionGain.gain.linearRampToValueAtTime(0.42 * clampedIntensity, now + 0.025);
      cushionGain.gain.exponentialRampToValueAtTime(0.0001, now + cushionDuration);

      cushionSource.connect(cushionFilter);
      cushionFilter.connect(cushionGain);
      cushionGain.connect(panner);

      cushionSource.start(now, cushionOffset, cushionDuration + 0.05);
    }

    // 🌟 LỚP 2: LỚP BỀ MẶT (Surface Texture - Giòn rụm lách tách hoặc xả khí thở)
    const surfaceBuffer =
      soundProfile === 'crunchy' && this.crunchyNoiseBuffer
        ? this.crunchyNoiseBuffer
        : this.whisperBreathBuffer;

    if (surfaceBuffer) {
      const surfaceSource = this.ctx.createBufferSource();
      surfaceSource.buffer = surfaceBuffer;
      surfaceSource.playbackRate.value = 0.95 + Math.random() * 0.2;
      const surfaceOffset = Math.random() * 1.5;

      const surfaceFilter = this.ctx.createBiquadFilter();

      if (soundProfile === 'crunchy') {
        // Tiếng lách tách giòn tan
        surfaceFilter.type = 'bandpass';
        surfaceFilter.frequency.setValueAtTime(2100 + clampedIntensity * 400, now);
        surfaceFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.22);
        surfaceFilter.Q.value = 1.8;
      } else {
        // Tiếng thở xả khí mút xốp
        surfaceFilter.type = 'bandpass';
        const center = materialType === 'glossy' ? 520 : (materialType === 'velvet' ? 380 : 440);
        surfaceFilter.frequency.setValueAtTime(center + clampedIntensity * 180, now);
        surfaceFilter.frequency.exponentialRampToValueAtTime(220, now + 0.24);
        surfaceFilter.Q.value = 0.9;
      }

      const surfaceGain = this.ctx.createGain();
      const surfaceDuration = mode === 'poke' ? 0.18 : 0.26;
      surfaceGain.gain.setValueAtTime(0.0001, now);
      surfaceGain.gain.linearRampToValueAtTime(
        (soundProfile === 'crunchy' ? 0.48 : 0.36) * clampedIntensity,
        now + 0.02
      );
      surfaceGain.gain.exponentialRampToValueAtTime(0.0001, now + surfaceDuration);

      surfaceSource.connect(surfaceFilter);
      surfaceFilter.connect(surfaceGain);
      surfaceGain.connect(panner);

      surfaceSource.start(now, surfaceOffset, surfaceDuration + 0.05);
    }
  }

  /**
   * 3. 🌟 TIẾNG THỞ HÚT KHÍ CHẬM RÃI (SLOW-RISE WHISPER - shhhhhh...)
   * Khi thả tay ra, âm thanh hút khí êm dịu (shhhhhh...) phát ra kéo dài khi squishy từ từ nở phồng to trở lại!
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

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const startFreq = 220;
    const peakFreq = materialType === 'glossy' ? 640 : (materialType === 'velvet' ? 460 : 540);

    filter.frequency.setValueAtTime(startFreq, now);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, now + soundDuration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(260, now + soundDuration);
    filter.Q.value = 0.85;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.28, now + soundDuration * 0.35);
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
