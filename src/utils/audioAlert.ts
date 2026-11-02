// Web Audio API simple chime synthesizer
class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  public playChime(type: 'high' | 'low') {
    try {
      this.initCtx();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      if (type === 'high') {
        // Cheerful upward chime
        osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880.0, this.ctx.currentTime + 0.15); // A5
      } else {
        // Alert chime
        osc.frequency.setValueAtTime(440.0, this.ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(329.63, this.ctx.currentTime + 0.15); // E4
      }

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // Audio autoplay policy handled silently
    }
  }
}

export const soundManager = new SoundManager();
