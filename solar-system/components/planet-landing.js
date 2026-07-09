AFRAME.registerComponent('planet-landing', {
  schema: { planet: { type: 'string', default: 'mars' }, lat: { type: 'number', default: 0 }, lon: { type: 'number', default: 0 }, altitude: { type: 'number', default: 10 } },
  init() {
    this.camera = document.querySelector('a-camera, [camera]') || document.querySelector('a-entity[camera]');
  },
  latLonToPosition(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI/180);
    const theta = (lon + 180) * (Math.PI/180);
    const x = - (radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x,y,z);
  },
  async land() {
    const planetId = this.data.planet;
    const radius = 1;
    const target = this.latLonToPosition(this.data.lat, this.data.lon, radius);
    const marker = document.createElement('a-entity');
    marker.setAttribute('position', `${target.x} ${target.y} ${target.z}`);
    this.el.sceneEl.appendChild(marker);
    const normal = target.clone().normalize();
    const camPos = target.clone().add(normal.clone().multiplyScalar(this.data.altitude / 100));
    const camera = this.camera;
    if (camera) {
      camera.setAttribute('animation__landpos', {
        property: 'position',
        to: `${camPos.x} ${camPos.y} ${camPos.z}`,
        dur: 2200,
        easing: 'easeInOutQuad'
      });
      setTimeout(()=> { camera.object3D.lookAt(target); }, 2300);
    }
    this.el.emit('planet-landed', {planet: planetId, lat: this.data.lat, lon: this.data.lon});
  }
});

