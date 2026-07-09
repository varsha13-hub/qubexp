AFRAME.registerComponent('planet-surface', {
  schema: { planet: { type: 'string', default: 'mars' }, radius: { type: 'number', default: 1 } },
  init() {
    this.planet = this.data.planet;
    this.el.setAttribute('geometry', { primitive: 'sphere', radius: this.data.radius });
    this.loadMaterial();
  },
  loadMaterial: async function() {
    const p = this.data;
    const base = `assets/planets/${this.planet}`;
    const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
    const loader = new THREE.TextureLoader();
    const mapFiles = [{k:'map', f:'albedo.png'},{k:'normal', f:'normal.png'},{k:'roughness', f:'roughness.png'},{k:'emissive', f:'emissive.png'}];
    for (const m of mapFiles) {
      const url = `${base}/${m.f}`;
      await new Promise((res) => {
        loader.load(url, (tex) => {
          material[m.k] = tex;
          res();
        }, undefined, () => { console.warn('[planet-surface] missing', url); res(); });
      });
    }
    if (this.el.getObject3D('mesh')) {
      this.el.getObject3D('mesh').geometry.dispose();
      this.el.getObject3D('mesh').material.dispose();
    }
    this.el.setObject3D('mesh', new THREE.Mesh(new THREE.SphereGeometry(p.radius, 64, 64), material));
    this.createCloudLayer(base);
  },
  createCloudLayer(base) {
    const cloudUrl = `${base}/clouds.png`;
    const loader = new THREE.TextureLoader();
    loader.load(cloudUrl, tex => {
      const geo = new THREE.SphereGeometry(this.data.radius * 1.01, 48, 48);
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.9, depthWrite: false });
      this.cloudMesh = new THREE.Mesh(geo, mat);
      this.el.getObject3D('mesh').add(this.cloudMesh);
      this.tick = (t, dt) => { this.cloudMesh.rotation.y += 0.0002 * dt; };
    }, undefined, ()=>{});
  },
  remove() {
    if (this.cloudMesh) { this.cloudMesh.geometry.dispose(); this.cloudMesh.material.dispose(); }
  }
});

