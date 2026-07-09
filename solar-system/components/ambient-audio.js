AFRAME.registerComponent('ambient-audio', {
  schema: { planet: { type: 'string', default: 'mars' }, loop: { type: 'boolean', default: true }, volume: { type: 'number', default: 0.6 } },
  init() {
    this.audioEl = document.createElement('audio');
    this.audioEl.setAttribute('playsinline','');
    this.audioEl.loop = this.data.loop;
    this.audioEl.crossOrigin = 'anonymous';
    this.el.appendChild(this.audioEl);
  },
  setSource(path) {
    this.audioEl.src = path;
    this.audioEl.volume = this.data.volume;
    this.audioEl.play().catch(e => console.warn('[ambient-audio] play failed', e));
  },
  setIntensity(v) {
    this.audioEl.volume = Math.min(1.0, this.data.volume + v*0.5);
  },
  stop() {
    try { this.audioEl.pause(); this.audioEl.currentTime = 0; } catch(e){}
  }
});

