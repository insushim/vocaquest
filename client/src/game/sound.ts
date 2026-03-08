// ============================================
// VocaQuest Online - Procedural Sound Engine
// All sounds generated via Web Audio API
// Dark fantasy MMORPG atmosphere
// ============================================

export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmPlaying: boolean = false;
  private currentBgm: string = "";
  private bgmNodes: Array<AudioNode & { stop?: (when?: number) => void }> = [];
  private bgmTimeouts: number[] = [];
  private initialized: boolean = false;
  private footstepPitchOffset: number = 0;

  constructor() {
    // AudioContext created on first user interaction
  }

  init(): void {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.5;
      this.bgmGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.initialized = true;
    } catch {
      // Web Audio API not supported
    }
  }

  private ensureCtx(): boolean {
    if (!this.ctx || !this.sfxGain || !this.bgmGain) return false;
    if (this.ctx.state === "suspended") this.ctx.resume();
    return true;
  }

  setMasterVolume(v: number): void {
    if (this.masterGain)
      this.masterGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setBgmVolume(v: number): void {
    if (this.bgmGain) this.bgmGain.gain.value = Math.max(0, Math.min(1, v));
  }

  setSfxVolume(v: number): void {
    if (this.sfxGain) this.sfxGain.gain.value = Math.max(0, Math.min(1, v));
  }

  // ================================================
  // Utility: Noise buffer
  // ================================================

  private createNoise(duration: number): AudioBufferSourceNode {
    const ctx = this.ctx!;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  private createConvolver(duration: number, decay: number): ConvolverNode {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = buffer;
    return conv;
  }

  // ================================================
  // SFX: Combat
  // ================================================

  playSlash(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Band-passed noise burst for swoosh
    const noise = this.createNoise(0.12);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(2000, now);
    hp.frequency.exponentialRampToValueAtTime(8000, now + 0.1);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 4000;
    bp.Q.value = 1.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(hp);
    hp.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  playHit(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Low thud
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.08);

    // Noise burst
    const noise = this.createNoise(0.06);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 800;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.2, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    noise.connect(lp);
    lp.connect(g2);
    g2.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.06);
  }

  playCriticalHit(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Bigger impact
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.5, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);

    // Ring tone
    const ring = ctx.createOscillator();
    ring.type = "sine";
    ring.frequency.value = 800;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.15, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    ring.connect(g2);
    g2.connect(this.sfxGain!);
    ring.start(now);
    ring.stop(now + 0.3);

    // Heavy noise
    const noise = this.createNoise(0.1);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1200;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.3, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    noise.connect(lp);
    lp.connect(g3);
    g3.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  playMiss(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Whoosh - filtered noise sweep
    const noise = this.createNoise(0.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1000, now);
    bp.frequency.exponentialRampToValueAtTime(4000, now + 0.1);
    bp.frequency.exponentialRampToValueAtTime(500, now + 0.2);
    bp.Q.value = 2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  // ================================================
  // SFX: Magic
  // ================================================

  playMagicCast(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Rising sine sweep
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.15, now);
    g1.gain.setValueAtTime(0.15, now + 0.2);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.5);

    // Harmonic at 3x
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(3600, now + 0.4);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.05, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(g2);
    g2.connect(this.sfxGain!);
    osc2.start(now);
    osc2.stop(now + 0.4);

    // Shimmer noise
    const noise = this.createNoise(0.3);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const g3 = ctx.createGain();
    g3.gain.setValueAtTime(0.06, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noise.connect(hp);
    hp.connect(g3);
    g3.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.3);
  }

  playMagicHit(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Sparkle burst
    const freqs = [1800, 2400, 3200];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // Low impact
    const bass = ctx.createOscillator();
    bass.type = "sine";
    bass.frequency.setValueAtTime(150, now);
    bass.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    const gb = ctx.createGain();
    gb.gain.setValueAtTime(0.25, now);
    gb.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    bass.connect(gb);
    gb.connect(this.sfxGain!);
    bass.start(now);
    bass.stop(now + 0.1);
  }

  playHeal(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Ascending arpeggio C5-E5-G5-C6
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const t = now + i * 0.15;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;

      // Slight vibrato
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = 5;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 3;
      lfo.connect(lfoG);
      lfoG.connect(osc.frequency);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.25);
      lfo.start(t);
      lfo.stop(t + 0.25);
    });
  }

  playBuff(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Quick ascending chime
    const notes = [660, 880, 1100];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  // ================================================
  // SFX: Arrow
  // ================================================

  playBowShot(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Twang noise burst
    const noise = this.createNoise(0.04);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2000;
    bp.Q.value = 3;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.25, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    noise.connect(bp);
    bp.connect(g1);
    g1.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.04);

    // Sine tail
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g2);
    g2.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playArrowHit(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Short thud
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.04);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.04);

    // High click
    const click = ctx.createOscillator();
    click.type = "sine";
    click.frequency.value = 3000;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.1, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
    click.connect(g2);
    g2.connect(this.sfxGain!);
    click.start(now);
    click.stop(now + 0.02);
  }

  // ================================================
  // SFX: Monster
  // ================================================

  playMonsterHit(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Distorted low growl burst
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.1);
    const dist = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 255 - 1;
      curve[i] = ((Math.PI + 3) * x) / (Math.PI + 3 * Math.abs(x));
    }
    dist.curve = curve;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(dist);
    dist.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playMonsterDeath(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Descending growl
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(lp);
    lp.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise fade
    const noise = this.createNoise(0.4);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(800, now);
    bp.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.1, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(bp);
    bp.connect(g2);
    g2.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.4);
  }

  // ================================================
  // SFX: Player
  // ================================================

  playPlayerDeath(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Dark descending tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 1.0);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.2, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 1.0);

    // Minor chord pad
    const minorNotes = [220, 261, 330]; // A3, C4, E4 (A minor)
    for (const f of minorNotes) {
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      o.connect(g);
      g.connect(this.sfxGain!);
      o.start(now + 0.1);
      o.stop(now + 1.2);
    }
  }

  playLevelUp(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // C4-E4-G4-C5-E5 arpeggio
    const notes = [262, 330, 392, 523, 659];
    notes.forEach((freq, i) => {
      const t = now + i * 0.2;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.15, t + 0.05);
      g.gain.setValueAtTime(0.15, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.5);

      // Harmonic
      const h = ctx.createOscillator();
      h.type = "sine";
      h.frequency.value = freq * 2;
      const gh = ctx.createGain();
      gh.gain.setValueAtTime(0.001, t);
      gh.gain.linearRampToValueAtTime(0.04, t + 0.05);
      gh.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      h.connect(gh);
      gh.connect(this.sfxGain!);
      h.start(t);
      h.stop(t + 0.3);
    });

    // Shimmer overlay
    const shimmer = this.createNoise(1.5);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 8000;
    const gs = ctx.createGain();
    gs.gain.setValueAtTime(0.001, now);
    gs.gain.linearRampToValueAtTime(0.04, now + 0.5);
    gs.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    shimmer.connect(hp);
    hp.connect(gs);
    gs.connect(this.sfxGain!);
    shimmer.start(now);
    shimmer.stop(now + 1.5);
  }

  playRespawn(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Soft ascending chime
    const notes = [392, 523, 659];
    notes.forEach((freq, i) => {
      const t = now + i * 0.15;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // ================================================
  // SFX: Enhancement
  // ================================================

  playEnhanceAttempt(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Rising sine with increasing tremolo
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 1.2);

    // Tremolo LFO
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(4, now);
    lfo.frequency.linearRampToValueAtTime(12, now + 1.2);
    const lfoG = ctx.createGain();
    lfoG.gain.setValueAtTime(0.3, now);
    lfoG.gain.linearRampToValueAtTime(0.8, now + 1.2);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.setValueAtTime(0.12, now + 1.0);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.3);

    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 1.3);
    lfo.start(now);
    lfo.stop(now + 1.3);
  }

  playEnhanceSuccess(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // C major chord burst (C4+E4+G4)
    const chord = [262, 330, 392];
    for (const f of chord) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.15, now + 0.05);
      g.gain.setValueAtTime(0.12, now + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now);
      osc.stop(now + 1.2);
    }

    // Ascending sweep
    const sweep = ctx.createOscillator();
    sweep.type = "sine";
    sweep.frequency.setValueAtTime(500, now);
    sweep.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
    const gs = ctx.createGain();
    gs.gain.setValueAtTime(0.001, now);
    gs.gain.linearRampToValueAtTime(0.08, now + 0.1);
    gs.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    sweep.connect(gs);
    gs.connect(this.sfxGain!);
    sweep.start(now);
    sweep.stop(now + 0.5);

    // Shimmer noise
    const shimmer = this.createNoise(1.0);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(0.001, now);
    gn.gain.linearRampToValueAtTime(0.06, now + 0.2);
    gn.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    shimmer.connect(hp);
    hp.connect(gn);
    gn.connect(this.sfxGain!);
    shimmer.start(now);
    shimmer.stop(now + 1.0);
  }

  playEnhanceFail(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Dark thud
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.3);

    // Descending minor tone
    const minor = ctx.createOscillator();
    minor.type = "triangle";
    minor.frequency.setValueAtTime(350, now + 0.05);
    minor.frequency.exponentialRampToValueAtTime(200, now + 0.5);
    const gm = ctx.createGain();
    gm.gain.setValueAtTime(0.001, now + 0.05);
    gm.gain.linearRampToValueAtTime(0.1, now + 0.1);
    gm.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    minor.connect(gm);
    gm.connect(this.sfxGain!);
    minor.start(now + 0.05);
    minor.stop(now + 0.5);
  }

  playEnhanceDestroy(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Glass shatter (noise burst)
    const noise = this.createNoise(0.4);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.setValueAtTime(3000, now);
    hp.frequency.exponentialRampToValueAtTime(800, now + 0.4);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.35, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noise.connect(hp);
    hp.connect(g1);
    g1.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.4);

    // Dark crash sweep
    const crash = ctx.createOscillator();
    crash.type = "sawtooth";
    crash.frequency.setValueAtTime(400, now);
    crash.frequency.exponentialRampToValueAtTime(50, now + 0.8);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 600;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.2, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    crash.connect(lp);
    lp.connect(g2);
    g2.connect(this.sfxGain!);
    crash.start(now);
    crash.stop(now + 0.8);

    // Dark pad (minor chord)
    const minorNotes = [147, 175, 220]; // D3, F3, A3
    for (const f of minorNotes) {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now + 0.2);
      g.gain.linearRampToValueAtTime(0.08, now + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(now + 0.2);
      osc.stop(now + 1.8);
    }
  }

  // ================================================
  // SFX: UI
  // ================================================

  playClick(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1200;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  playOpen(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Ascending two-note
    const notes = [440, 660];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  }

  playClose(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Descending two-note
    const notes = [660, 440];
    notes.forEach((freq, i) => {
      const t = now + i * 0.08;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  playPickup(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 1400;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playDrop(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  playGold(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Rapid metallic tones
    const freqs = [2000, 2500, 3000];
    freqs.forEach((f, i) => {
      const t = now + i * 0.05;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.1);
    });
  }

  playPotion(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Gulp sweep
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.001, now);
    g1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g1);
    g1.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.25);

    // Bubbling
    for (let i = 0; i < 4; i++) {
      const t = now + 0.1 + i * 0.06;
      const b = ctx.createOscillator();
      b.type = "sine";
      b.frequency.value = 600 + Math.random() * 400;
      const gb = ctx.createGain();
      gb.gain.setValueAtTime(0.001, t);
      gb.gain.linearRampToValueAtTime(0.04, t + 0.01);
      gb.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      b.connect(gb);
      gb.connect(this.sfxGain!);
      b.start(t);
      b.stop(t + 0.04);
    }
  }

  playError(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Low buzz
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = 100;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(g);
    g.connect(this.sfxGain!);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playNotification(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Ding-dong
    const notes = [880, 660];
    notes.forEach((freq, i) => {
      const t = now + i * 0.15;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.1, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playQuestComplete(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Short fanfare: G4-C5-E5-G5
    const notes = [392, 523, 659, 784];
    notes.forEach((freq, i) => {
      const t = now + i * 0.12;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);

      // Octave harmonic for richness
      const h = ctx.createOscillator();
      h.type = "sine";
      h.frequency.value = freq * 2;
      const gh = ctx.createGain();
      gh.gain.setValueAtTime(0.001, t);
      gh.gain.linearRampToValueAtTime(0.03, t + 0.03);
      gh.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      h.connect(gh);
      gh.connect(this.sfxGain!);
      h.start(t);
      h.stop(t + 0.2);
    });
  }

  playAchievement(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Fanfare + extra sparkle
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const t = now + i * 0.1;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.12, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(g);
      g.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.4);
    });

    // Extra sparkle shimmer
    const shimmer = this.createNoise(0.6);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 8000;
    const gs = ctx.createGain();
    gs.gain.setValueAtTime(0.001, now + 0.2);
    gs.gain.linearRampToValueAtTime(0.05, now + 0.3);
    gs.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    shimmer.connect(hp);
    hp.connect(gs);
    gs.connect(this.sfxGain!);
    shimmer.start(now + 0.2);
    shimmer.stop(now + 0.8);
  }

  // ================================================
  // SFX: Footstep
  // ================================================

  playFootstep(): void {
    if (!this.ensureCtx()) return;
    const ctx = this.ctx!;
    const now = ctx.currentTime;

    // Vary pitch each call
    this.footstepPitchOffset = (this.footstepPitchOffset + 1) % 3;
    const pitchMult = 1 + (this.footstepPitchOffset - 1) * 0.1;
    const baseFreq = 300 * pitchMult;

    const noise = this.createNoise(0.03);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = baseFreq;
    bp.Q.value = 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.sfxGain!);
    noise.start(now);
    noise.stop(now + 0.03);
  }

  // ================================================
  // BGM System
  // ================================================

  playBgm(zone: string): void {
    if (!this.ensureCtx()) return;
    if (this.currentBgm === zone && this.bgmPlaying) return;

    // Crossfade: fade out old
    this.fadeOutBgm(() => {
      this.currentBgm = zone;
      this.bgmPlaying = true;

      const zoneMap: Record<string, () => void> = {
        town: () => this.playTownBgm(),
        starter_meadow: () => this.playMeadowBgm(),
        dark_forest: () => this.playForestBgm(),
        scorching_desert: () => this.playDesertBgm(),
        frozen_mountains: () => this.playMountainBgm(),
        volcanic_cavern: () => this.playCavernBgm(),
        shadow_realm: () => this.playShadowBgm(),
        ancient_ruins: () => this.playRuinsBgm(),
        abyssal_depths: () => this.playAbyssBgm(),
        dragons_sanctum: () => this.playDragonBgm(),
      };

      const fn = zoneMap[zone] || zoneMap.town;
      fn();
    });
  }

  stopBgm(): void {
    this.bgmPlaying = false;
    this.currentBgm = "";
    this.cleanupBgm();
  }

  private fadeOutBgm(onComplete: () => void): void {
    if (!this.bgmPlaying || !this.bgmGain || !this.ctx) {
      this.cleanupBgm();
      onComplete();
      return;
    }

    const now = this.ctx.currentTime;
    const currentVal = this.bgmGain.gain.value;
    this.bgmGain.gain.setValueAtTime(currentVal, now);
    this.bgmGain.gain.linearRampToValueAtTime(0, now + 1.5);

    setTimeout(() => {
      this.cleanupBgm();
      if (this.bgmGain) {
        this.bgmGain.gain.setValueAtTime(0, this.ctx!.currentTime);
        this.bgmGain.gain.linearRampToValueAtTime(
          0.5,
          this.ctx!.currentTime + 1.5,
        );
      }
      onComplete();
    }, 1600);
  }

  private cleanupBgm(): void {
    for (const node of this.bgmNodes) {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // Already stopped
      }
    }
    this.bgmNodes = [];
    for (const t of this.bgmTimeouts) {
      clearTimeout(t);
    }
    this.bgmTimeouts = [];
  }

  // ================================================
  // BGM: Helper to create a pad voice
  // ================================================

  private createPadVoice(
    freq: number,
    type: OscillatorType,
    volume: number,
    lfoRate: number,
    lfoDepth: number,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = lfoRate;
    const lfoG = ctx.createGain();
    lfoG.gain.value = lfoDepth;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);

    const g = ctx.createGain();
    g.gain.value = volume;

    osc.connect(g);
    g.connect(this.bgmGain!);
    osc.start();
    lfo.start();

    this.bgmNodes.push(osc, lfo, g, lfoG);
  }

  private scheduleArpeggio(
    scale: number[],
    interval: number,
    randomRange: number,
    volume: number,
    duration: number,
    type: OscillatorType = "sine",
  ): void {
    const playNote = () => {
      if (!this.bgmPlaying) return;
      const ctx = this.ctx!;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      const tid = window.setTimeout(
        playNote,
        interval + Math.random() * randomRange,
      );
      this.bgmTimeouts.push(tid);
    };
    const tid = window.setTimeout(playNote, 1000 + Math.random() * 2000);
    this.bgmTimeouts.push(tid);
  }

  // ================================================
  // BGM: Town - Warm, peaceful, major key
  // ================================================

  private playTownBgm(): void {
    // Warm pad: C3 + E3 + G3
    this.createPadVoice(131, "sine", 0.05, 0.3, 2);
    this.createPadVoice(165, "sine", 0.04, 0.25, 1.5);
    this.createPadVoice(196, "sine", 0.04, 0.35, 2);
    // Gentle triangle sub
    this.createPadVoice(65, "triangle", 0.03, 0.1, 1);

    // Gentle arpeggio from C major pentatonic
    this.scheduleArpeggio(
      [262, 294, 330, 392, 440, 523],
      2500,
      2500,
      0.03,
      2.5,
    );
  }

  // ================================================
  // BGM: Meadow - Light, airy, pastoral
  // ================================================

  private playMeadowBgm(): void {
    // Light airy pad: G3 + B3 + D4
    this.createPadVoice(196, "sine", 0.04, 0.4, 2);
    this.createPadVoice(247, "sine", 0.03, 0.3, 1.5);
    this.createPadVoice(294, "sine", 0.03, 0.35, 2);

    // Birdsong-like chirps (high frequency)
    this.scheduleArpeggio(
      [1047, 1175, 1319, 1568, 1760],
      3000,
      4000,
      0.02,
      0.4,
    );

    // Pastoral melody
    this.scheduleArpeggio([392, 440, 523, 587, 659], 2000, 3000, 0.025, 2.0);
  }

  // ================================================
  // BGM: Forest - Mysterious, minor key
  // ================================================

  private playForestBgm(): void {
    // Deep minor pad: A2 + C3 + E3
    this.createPadVoice(110, "sine", 0.05, 0.2, 3);
    this.createPadVoice(131, "triangle", 0.04, 0.15, 2);
    this.createPadVoice(165, "sine", 0.03, 0.25, 2);

    // Occasional eerie tones (A minor pentatonic)
    this.scheduleArpeggio([220, 262, 330, 392, 523], 4000, 5000, 0.02, 3.0);

    // Low occasional rumble
    const rumble = () => {
      if (!this.bgmPlaying) return;
      const ctx = this.ctx!;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 40 + Math.random() * 20;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start();
      osc.stop(ctx.currentTime + 3);
      const tid = window.setTimeout(rumble, 8000 + Math.random() * 10000);
      this.bgmTimeouts.push(tid);
    };
    const tid = window.setTimeout(rumble, 5000);
    this.bgmTimeouts.push(tid);
  }

  // ================================================
  // BGM: Desert - Phrygian mode, exotic, sparse
  // ================================================

  private playDesertBgm(): void {
    // Phrygian pad: E3 + F3 + A3 (exotic)
    this.createPadVoice(165, "sine", 0.04, 0.2, 2);
    this.createPadVoice(175, "triangle", 0.03, 0.15, 1);
    this.createPadVoice(220, "sine", 0.03, 0.25, 2);

    // Phrygian scale melody, sparse
    this.scheduleArpeggio(
      [330, 349, 392, 440, 523, 554],
      3500,
      5000,
      0.025,
      2.0,
    );

    // Wind-like noise
    const ctx = this.ctx!;
    const noise = this.createNoise(60);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 800;
    bp.Q.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 300;
    lfo.connect(lfoG);
    lfoG.connect(bp.frequency);
    const g = ctx.createGain();
    g.gain.value = 0.015;
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.bgmGain!);
    noise.start();
    lfo.start();
    this.bgmNodes.push(noise, bp, lfo, lfoG, g);
  }

  // ================================================
  // BGM: Mountains - Cold/epic, wide, wind noise
  // ================================================

  private playMountainBgm(): void {
    // Wide pad (5ths): C3 + G3
    this.createPadVoice(131, "sine", 0.05, 0.15, 2);
    this.createPadVoice(196, "sine", 0.04, 0.2, 2);
    this.createPadVoice(262, "triangle", 0.02, 0.1, 1);

    // Wind noise
    const ctx = this.ctx!;
    const noise = this.createNoise(60);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 600;
    bp.Q.value = 0.3;
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.05;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 400;
    lfo.connect(lfoG);
    lfoG.connect(bp.frequency);
    const g = ctx.createGain();
    g.gain.value = 0.025;
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.bgmGain!);
    noise.start();
    lfo.start();
    this.bgmNodes.push(noise, bp, lfo, lfoG, g);

    // Slow, cold notes
    this.scheduleArpeggio([262, 294, 392, 523, 587], 4000, 6000, 0.02, 3.5);
  }

  // ================================================
  // BGM: Cavern - Dark, dripping, echo
  // ================================================

  private playCavernBgm(): void {
    // Dark minor pad: D3 + F3 + Ab3
    this.createPadVoice(147, "sine", 0.04, 0.1, 2);
    this.createPadVoice(175, "triangle", 0.03, 0.15, 1.5);
    this.createPadVoice(208, "sine", 0.03, 0.12, 2);
    // Sub bass
    this.createPadVoice(55, "sine", 0.04, 0.05, 1);

    // Dripping sounds (random high pings)
    const drip = () => {
      if (!this.bgmPlaying) return;
      const ctx = this.ctx!;
      const freq = 2000 + Math.random() * 2000;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      const tid = window.setTimeout(drip, 1500 + Math.random() * 4000);
      this.bgmTimeouts.push(tid);
    };
    const tid = window.setTimeout(drip, 2000);
    this.bgmTimeouts.push(tid);
  }

  // ================================================
  // BGM: Shadow - Dissonant, dark, low rumble
  // ================================================

  private playShadowBgm(): void {
    // Dissonant pad (tritone): B2 + F3
    this.createPadVoice(123, "sine", 0.05, 0.1, 3);
    this.createPadVoice(175, "triangle", 0.04, 0.08, 2);
    // Low rumble
    this.createPadVoice(40, "sine", 0.05, 0.03, 1);

    // Dark dissonant tones
    this.scheduleArpeggio(
      [123, 175, 247, 349],
      5000,
      6000,
      0.02,
      4.0,
      "triangle",
    );

    // Subtle noise texture
    const ctx = this.ctx!;
    const noise = this.createNoise(60);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 300;
    const g = ctx.createGain();
    g.gain.value = 0.02;
    noise.connect(lp);
    lp.connect(g);
    g.connect(this.bgmGain!);
    noise.start();
    this.bgmNodes.push(noise, lp, g);
  }

  // ================================================
  // BGM: Volcanic - Intense, rumbling, crackling
  // ================================================

  private playVolcanicBgm(): void {
    // Deep rumbling bass
    this.createPadVoice(45, "sine", 0.06, 0.08, 2);
    this.createPadVoice(90, "triangle", 0.04, 0.1, 3);
    this.createPadVoice(135, "sawtooth", 0.02, 0.12, 2);

    // Crackling noise texture
    const ctx = this.ctx!;
    const noise = this.createNoise(60);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2000;
    bp.Q.value = 2;
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 8;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.03;
    const g = ctx.createGain();
    g.gain.value = 0.02;
    lfo.connect(lfoG);
    lfoG.connect(g.gain);
    noise.connect(bp);
    bp.connect(g);
    g.connect(this.bgmGain!);
    noise.start();
    lfo.start();
    this.bgmNodes.push(noise, bp, lfo, lfoG, g);

    // Ominous tones
    this.scheduleArpeggio([110, 147, 165, 220], 3000, 4000, 0.02, 3.0);
  }

  // ================================================
  // BGM: Ruins - Haunting, Dorian mode, reverb
  // ================================================

  private playRuinsBgm(): void {
    // Dorian pad: D3 + F3 + A3
    this.createPadVoice(147, "sine", 0.04, 0.15, 2);
    this.createPadVoice(175, "sine", 0.035, 0.2, 1.5);
    this.createPadVoice(220, "triangle", 0.03, 0.18, 2);

    // Haunting Dorian melody
    this.scheduleArpeggio(
      [294, 330, 349, 440, 523, 587],
      3000,
      4000,
      0.025,
      3.0,
    );

    // Subtle ancient echo pings
    const echo = () => {
      if (!this.bgmPlaying) return;
      const ctx = this.ctx!;
      const freq = [523, 587, 659, 784][Math.floor(Math.random() * 4)];
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);

      // Echo repeat
      setTimeout(() => {
        if (!this.bgmPlaying) return;
        const o2 = ctx.createOscillator();
        o2.type = "sine";
        o2.frequency.value = freq;
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.001, ctx.currentTime);
        g2.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.02);
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
        o2.connect(g2);
        g2.connect(this.bgmGain!);
        o2.start();
        o2.stop(ctx.currentTime + 1.0);
      }, 300);

      const tid = window.setTimeout(echo, 4000 + Math.random() * 6000);
      this.bgmTimeouts.push(tid);
    };
    const tid = window.setTimeout(echo, 3000);
    this.bgmTimeouts.push(tid);
  }

  // ================================================
  // BGM: Abyss - Void, minimal, unsettling
  // ================================================

  private playAbyssBgm(): void {
    // Sub-bass drone
    this.createPadVoice(30, "sine", 0.06, 0.02, 0.5);
    // High eerie tone
    this.createPadVoice(1047, "sine", 0.015, 0.5, 5);
    // Dissonant mid
    this.createPadVoice(233, "triangle", 0.02, 0.08, 2);

    // Very sparse, unsettling notes
    this.scheduleArpeggio([175, 233, 311, 466], 6000, 8000, 0.015, 4.0);
  }

  // ================================================
  // BGM: Dragon - Epic boss, powerful, driving
  // ================================================

  private playDragonBgm(): void {
    // Power chords: A2 + E3 + A3
    this.createPadVoice(110, "sawtooth", 0.03, 0.1, 2);
    this.createPadVoice(165, "sine", 0.05, 0.15, 3);
    this.createPadVoice(220, "sine", 0.04, 0.12, 2);
    // Deep bass
    this.createPadVoice(55, "sine", 0.05, 0.05, 1);

    // Driving subtle pulse
    const pulse = () => {
      if (!this.bgmPlaying) return;
      const ctx = this.ctx!;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 110;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(g);
      g.connect(this.bgmGain!);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);

      const tid = window.setTimeout(pulse, 600);
      this.bgmTimeouts.push(tid);
    };
    const tid1 = window.setTimeout(pulse, 500);
    this.bgmTimeouts.push(tid1);

    // Epic melody
    this.scheduleArpeggio(
      [220, 262, 330, 392, 440, 523],
      1500,
      2000,
      0.03,
      1.5,
    );
  }
}

export const soundEngine = new SoundEngine();
