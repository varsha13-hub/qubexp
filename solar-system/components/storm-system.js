AFRAME.registerComponent('storm-system', {
  schema: { planet: { type: 'string', default: 'mars' }, intensity: { type: 'number', default: 0.6 }, color: { type: 'color', default: '#ffddaa' }, speed: { type: 'number', default: 1.0 } },
  init() {
    this.systemEl = document.createElement('a-entity');
    this.el.sceneEl.appendChild(this.systemEl);
    this.particles = [];
    this.active = false;
  },
  start() {
    this.active = true;
    const particleCount = Math.max(40, Math.floor(this.data.intensity * 200));
    for (let i=0;i<particleCount;i++) {
      const p = document.createElement('a-entity');
      p.setAttribute('geometry', { primitive: 'sphere', radius: 0.01 });
      p.setAttribute('material', { color: this.data.color, opacity: 0.6 });
      const v = new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).normalize().multiplyScalar(1.02);
      p.setAttribute('position', `${v.x} ${v.y} ${v.z}`);
      this.systemEl.appendChild(p);
      this.particles.push({el:p, dir: Math.random()>0.5?1:-1});
    }
    this.tick = this._tick.bind(this);
  },
  _tick(t, dt) {
    if (!this.active) return;
    for (const p of this.particles) {
      const obj = p.el.object3D;
      obj.rotateY((0.0002 * this.data.speed * p.dir) * dt);
      obj.position.y += Math.sin(t/1000 + Math.random()) * 0.0005 * this.data.intensity;
    }
  },
  stop() {
    this.active = false;
    this.particles.forEach(p => p.el.remove());
    this.particles = [];
  }
});

