/* ---- Model Preloader Helper ---- */
const ModelPreloader = (function(){
  const cache = new Map();
  let loader = null;
  
  function ensureLoader() {
    if (!loader) {
      if (!window.THREE || !window.THREE.GLTFLoader) {
        console.warn('THREE.GLTFLoader missing; include GLTFLoader');
        // For A-Frame, GLTFLoader is often available at THREE.GLTFLoader
      }
      loader = new THREE.GLTFLoader(); // assuming loader exists
    }
    return loader;
  }
  
  async function resolveAttr(attr) {
    if (!attr) return null;
    if (typeof attr === 'string' && attr.startsWith('#')) {
      const asset = document.getElementById(attr.slice(1));
      if (asset) return asset.getAttribute('src') || asset.src || null;
    }
    return attr;
  }
  
  async function preloadAll(timeoutMs = 12000) {
    const els = Array.from(document.querySelectorAll('[gltf-model]'));
    const urls = [...new Set(els.map(e => e.getAttribute('gltf-model')).filter(Boolean))];
    const resolved = await Promise.all(urls.map(resolveAttr));
    const unique = [...new Set(resolved.filter(Boolean))];
    if (!unique.length) return cache;

    ensureLoader();
    const promises = unique.map(url => {
      if (cache.has(url)) return Promise.resolve(cache.get(url));
      return new Promise(resolve => {
        loader.load(url,
          gltf => { cache.set(url, gltf); resolve(gltf); },
          undefined,
          err => { console.warn('model load failed', url, err); resolve(null); }
        );
      });
    });
    // timeout guard
    const all = Promise.all(promises);
    try {
      const res = await Promise.race([all, new Promise((_, rej) => setTimeout(() => rej(new Error('model preload timeout')), timeoutMs))]);
      console.log('ModelPreloader: done. cache size:', cache.size);
    } catch (e) {
      console.warn('ModelPreloader: timeout or error', e);
    }
    return cache;
  }

  function applyCachedToEntities() {
    document.querySelectorAll('[gltf-model]').forEach(el => {
      const attr = el.getAttribute('gltf-model');
      resolveAttr(attr).then(url => {
        const g = url && cache.get(url);
        if (g && g.scene) {
          // avoid A-Frame re-loading; set object3D directly
          try {
            el.removeAttribute('gltf-model');
            const clone = g.scene.clone(true);
            el.setObject3D('mesh', clone);
          } catch (e) {
            console.warn('applyCachedToEntities error', e);
          }
        }
      });
    });
  }

  return { preloadAll, applyCachedToEntities };
})();

/* ---- Tour Controller for Pause/Resume ---- */
window.TourController = {
  paused: false,
  _resumeResolve: null,
  pause() {
    if (this.paused) return;
    this.paused = true;
    if (window.SarvamTTS) window.SarvamTTS.pause();
    console.log('⏸ Tour paused');
  },
  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (window.SarvamTTS) window.SarvamTTS.resume();
    if (this._resumeResolve) { this._resumeResolve(); this._resumeResolve = null; }
    console.log('▶ Tour resumed');
  },
  waitForResume() {
    if (!this.paused) return Promise.resolve();
    return new Promise(resolve => this._resumeResolve = resolve);
  }
};

/* ---- Wait with Pause Helper ---- */
async function waitWithPause(ms) {
  const chunk = 200;
  let remaining = ms;
  while (remaining > 0) {
    if (window.TourController && window.TourController.paused) {
      await window.TourController.waitForResume();
      continue;
    }
    await new Promise(r => setTimeout(r, Math.min(chunk, remaining)));
    remaining -= chunk;
  }
}

// Expose globally
window.waitWithPause = waitWithPause;

// VR Scene Controller for A-Frame
class VRSceneController {
    constructor() {
        this.currentPlanet = null;
        this.planets = [];
        this.currentLanguage = 'en';
        this.isDesktopMode = false;
        this.isVRMode = false;
        this.starField = null;
        this.sceneLoaded = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('Starting VR scene initialization...');
            this.setupLoadingTimeout(); // Add timeout protection
            this.checkMode();
            this.setupEventListeners();
            
            // Use fallback planets immediately to avoid hanging
            this.planets = this.getFallbackPlanets();
            console.log('Planets loaded:', this.planets.length);
            
            this.generateStarField();
            this.setupPlanetInteractions();
            
            // Force hide loading screen after a short delay
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
            console.log('VR scene initialization complete');
        } catch (error) {
            console.error('VR Scene initialization error:', error);
            this.showError('Failed to initialize VR scene: ' + error.message);
            // Always hide loading screen even if there's an error
            this.hideLoadingScreen();
        }
    }

    checkMode() {
        const urlParams = new URLSearchParams(window.location.search);
        this.isDesktopMode = urlParams.get('mode') === 'desktop';
        
        // Also check if we're not in VR mode
        if (!this.isVRMode && !this.isDesktopMode) {
            // Check if WebXR is not supported or user is on desktop
            if (!('xr' in navigator) || window.innerWidth > 768) {
                this.isDesktopMode = true;
            }
        }
        
        if (this.isDesktopMode) {
            this.showDesktopUI();
        }
    }

    setupEventListeners() {
        // Wait for A-Frame to be ready
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, setting up A-Frame listeners');
            
            // Wait for A-Frame to be available
            if (typeof AFRAME !== 'undefined') {
                this.setupAFrameScene();
            } else {
                // Wait for A-Frame to load
                window.addEventListener('load', () => {
                    if (typeof AFRAME !== 'undefined') {
                        this.setupAFrameScene();
                    } else {
                        console.log('A-Frame not available, using fallback');
                        this.setupFallbackMode();
                    }
                });
            }
        });

        // Desktop UI controls
        const desktopMic = document.getElementById('desktopMic');
        if (desktopMic) {
            desktopMic.addEventListener('click', () => {
                this.startVoiceCommand();
            });
        }

        const desktopLanguage = document.getElementById('desktopLanguage');
        if (desktopLanguage) {
            desktopLanguage.addEventListener('click', () => {
                this.showLanguageSelector();
            });
        }

        const desktopFullscreen = document.getElementById('desktopFullscreen');
        if (desktopFullscreen) {
            desktopFullscreen.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        }

        // VR UI controls
        this.setupVREventListeners();
    }

    setupAFrameScene() {
        console.log('Setting up A-Frame scene...');
        const scene = document.querySelector('a-scene');
        if (scene) {
            // Force A-Frame to initialize
            if (scene.hasLoaded) {
                console.log('A-Frame scene already loaded');
                this.onSceneLoaded();
            } else {
                scene.addEventListener('loaded', () => {
                    console.log('A-Frame scene loaded');
                    this.onSceneLoaded();
                });
                
                // Force scene to load if it hasn't already
                if (!scene.hasLoaded) {
                    console.log('Forcing A-Frame scene to load...');
                    scene.load();
                }
            }
            
            // Add timeout in case A-Frame doesn't load properly
            setTimeout(() => {
                if (document.getElementById('loadingScreen').style.display !== 'none') {
                    console.log('A-Frame loading timeout, forcing hide and fallback');
                    this.hideLoadingScreen();
                    this.setupFallbackMode();
                }
            }, 3000);
        } else {
            console.log('A-Frame scene not found, using fallback');
            this.setupFallbackMode();
        }
    }

    setupFallbackMode() {
        console.log('Setting up fallback mode for non-VR experience');
        this.isDesktopMode = true;
        this.showDesktopUI();
        this.hideLoadingScreen();
        
        // Show a message that VR is not available
        this.showNotification('VR mode not available. Using desktop mode.', 'info');
    }

    setupVREventListeners() {
        // Mic button
        const micButton = document.getElementById('micButton');
        if (micButton) {
            micButton.addEventListener('click', () => {
                this.startVoiceCommand();
            });
        }

        // Navigation buttons
        const prevButton = document.getElementById('prevButton');
        const nextButton = document.getElementById('nextButton');
        
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.navigateToPreviousPlanet();
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.navigateToNextPlanet();
            });
        }

        // Speak button
        const speakButton = document.getElementById('speakButton');
        if (speakButton) {
            speakButton.addEventListener('click', () => {
                this.speakPlanetInfo();
            });
        }
    }

    onSceneLoaded() {
        console.log('A-Frame scene loaded');
        this.isVRMode = true;
        this.sceneLoaded = true;
        
        // Ensure the scene is visible
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.style.display = 'block';
            scene.style.visibility = 'visible';
            console.log('Scene visibility set to visible');
        }
        
        // Test if planets are visible
        this.testPlanetVisibility();
        
        // Initialize VR-specific features
        this.setupVRControls();
        this.loadLanguageFromSession();
        
        // Hide loading screen
        this.hideLoadingScreen();
        
        // Show success notification
        this.showNotification('VR Scene loaded successfully!', 'success');
        
        // Force a render update
        if (scene && scene.renderer) {
            scene.renderer.render(scene.object3D, scene.camera);
        }
    }

    testPlanetVisibility() {
        console.log('Testing planet visibility...');
        const planets = document.querySelectorAll('.planet');
        console.log(`Found ${planets.length} planets in the scene`);
        
        planets.forEach((planet, index) => {
            const planetId = planet.getAttribute('data-planet-id');
            console.log(`Planet ${index + 1}: ${planetId} - Visible: ${planet.style.display !== 'none'}`);
        });
    }

    setupVRControls() {
        // Setup gaze controls for VR
        const cursor = document.getElementById('cursor');
        if (cursor) {
            cursor.addEventListener('click', (event) => {
                this.handleVRClick(event);
            });
        }

        // Setup controller events
        const camera = document.getElementById('camera');
        if (camera) {
            camera.addEventListener('controllerconnected', (event) => {
                console.log('VR controller connected:', event.detail.name);
            });
        }
    }

    handleVRClick(event) {
        const intersectedObject = event.detail.intersectedEl;
        if (intersectedObject && intersectedObject.classList.contains('planet')) {
            const planetId = intersectedObject.getAttribute('data-planet-id');
            this.selectPlanet(planetId);
        }
    }

    async loadPlanets() {
        try {
            const response = await fetch('http://localhost:8080/api/planets');
            if (!response.ok) {
                throw new Error('Failed to load planets');
            }
            const data = await response.json();
            this.planets = data.planets;
        } catch (error) {
            console.error('Error loading planets:', error);
            // Load from cache or use fallback
            this.planets = this.getFallbackPlanets();
        }
    }

    getFallbackPlanets() {
        return [
            { id: 'sun', name: 'Sun', description: 'The star at the center of our Solar System.' },
            { id: 'mercury', name: 'Mercury', description: 'The smallest and innermost planet in the Solar System.' },
            { id: 'venus', name: 'Venus', description: 'The second planet from the Sun, often called Earth\'s sister planet.' },
            { id: 'earth', name: 'Earth', description: 'Our home planet, the only known planet with life.' },
            { id: 'mars', name: 'Mars', description: 'The Red Planet, target for future human exploration.' },
            { id: 'jupiter', name: 'Jupiter', description: 'The largest planet in our Solar System, a gas giant.' },
            { id: 'saturn', name: 'Saturn', description: 'Known for its beautiful ring system.' },
            { id: 'uranus', name: 'Uranus', description: 'An ice giant planet with a tilted axis.' },
            { id: 'neptune', name: 'Neptune', description: 'The farthest planet from the Sun, another ice giant.' },
            { id: 'pluto', name: 'Pluto', description: 'A dwarf planet in the Kuiper Belt.' }
        ];
    }

    generateStarField() {
        try {
            const starField = document.getElementById('starField');
            if (!starField) {
                console.log('Starfield element not found, skipping...');
                return;
            }

            // Generate fewer stars for faster loading
            for (let i = 0; i < 20; i++) {
                const star = document.createElement('a-sphere');
                star.setAttribute('radius', 0.01);
                star.setAttribute('position', {
                    x: (Math.random() - 0.5) * 50,
                    y: (Math.random() - 0.5) * 50,
                    z: (Math.random() - 0.5) * 50
                });
                star.setAttribute('material', {
                    color: '#ffffff',
                    shader: 'flat'
                });
                starField.appendChild(star);
            }
            console.log('Starfield generated successfully');
        } catch (error) {
            console.error('Error generating starfield:', error);
        }
    }

    generate360SolarSystem() {
        try {
            // Generate 360° solar system texture
            const canvas = document.getElementById('solarSystem360');
            if (!canvas) {
                console.log('360° solar system canvas not found, skipping...');
                return;
            }
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // Create space background
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#000011');
        gradient.addColorStop(0.5, '#000033');
        gradient.addColorStop(1, '#000011');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Add solar system elements (planets, orbits, etc.)
        this.drawSolarSystemElements(ctx, width, height);
        } catch (error) {
            console.error('Error generating 360° solar system:', error);
        }
    }

    drawSolarSystemElements(ctx, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Draw Sun at the center
        const sunGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
        sunGradient.addColorStop(0, '#ffff00');
        sunGradient.addColorStop(0.7, '#ffaa00');
        sunGradient.addColorStop(1, '#ff4400');
        
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
        ctx.fill();
        
        // Add glow effect
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 35, 0, 2 * Math.PI);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw planet orbits (concentric circles)
        const planetColors = ['#A0522D', '#E6BE8A', '#6B93D6', '#CD5C5C', '#D8CA9D', '#FAD5A5', '#B3E4E3', '#5B5DDF', '#C0C0C0'];
        const orbitRadii = [50, 80, 120, 160, 220, 280, 340, 400, 450];
        
        for (let i = 0; i < orbitRadii.length; i++) {
            ctx.strokeStyle = planetColors[i];
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(centerX, centerY, orbitRadii[i], 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw planet on orbit
            const angle = Math.random() * 2 * Math.PI;
            const planetX = centerX + orbitRadii[i] * Math.cos(angle);
            const planetY = centerY + orbitRadii[i] * Math.sin(angle);
            const planetSize = 3 + Math.random() * 4;
            
            ctx.fillStyle = planetColors[i];
            ctx.beginPath();
            ctx.arc(planetX, planetY, planetSize, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.setLineDash([]);
    }

    setupPlanetInteractions() {
        // Add click handlers to all planets
        const planets = document.querySelectorAll('.planet');
        planets.forEach(planet => {
            planet.addEventListener('click', (event) => {
                const planetId = planet.getAttribute('data-planet-id');
                this.selectPlanet(planetId);
            });
        });
    }

    async selectPlanet(planetId) {
        const planet = this.planets.find(p => p.id === planetId);
        if (!planet) return;

        // 🛑 GUARD: Check if TTS is busy or selection is disabled
        if (window.ttsBusy) {
            console.log('🛑 selectPlanet: TTS busy, skipping', planet.name);
            return;
        }
        
        if (window.selectionDisabled) {
            console.log('🛑 selectPlanet: selection disabled, skipping', planet.name);
            return;
        }
        
        if (window.tourActive) {
            console.log('🛑 selectPlanet: tour active, skipping', planet.name);
            return;
        }

        this.currentPlanet = planet;
        console.log('Selected planet:', planet.name);
        
        // Set TTS busy flag to prevent overlapping calls
        window.ttsBusy = true;
        
        try {
            // Always try to translate planet info for better user experience
            const response = await fetch('http://localhost:8080/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: planet.description,
                    sourceLang: 'en',
                    targetLang: this.currentLanguage
                })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.translatedText) {
                    const translatedDescription = result.translatedText;
                    
                    const translatedPlanet = {
                        ...planet,
                        description: translatedDescription
                    };
                    
                    this.showPlanetInfo(translatedPlanet);
                    await this.speakPlanetInfo(translatedDescription);
                } else {
                    // Fallback to original text
                    this.showPlanetInfo(planet);
                    await this.speakPlanetInfo(planet.description);
                }
            } else {
                // Fallback to original text
                this.showPlanetInfo(planet);
                await this.speakPlanetInfo(planet.description);
            }
        } catch (error) {
            console.error('Translation failed, using original text:', error);
            this.showPlanetInfo(planet);
            await this.speakPlanetInfo(planet.description);
        } finally {
            // Always release the TTS busy flag
            window.ttsBusy = false;
        }
        
        this.highlightPlanet(planetId);
    }

    async speakPlanetInfo(text) {
        try {
            console.log(`🎤 Speaking planet info in ${this.currentLanguage}: ${text.substring(0, 50)}...`);
            
            // Use Sarvam TTS via ttsManager with separated fetch/play
            if (window.ttsManager && window.ttsManager.fetchServerTTSAudio) {
                console.log(`🎯 Fetching Sarvam TTS for ${this.currentLanguage}`);
                const audioData = await window.ttsManager.fetchServerTTSAudio(text, this.currentLanguage);
                console.log(`🎵 Playing TTS in ${this.currentLanguage} using Sarvam API`);
                await window.ttsManager.playServerTTSAudio(audioData);
            } else {
                throw new Error('TTS Manager not available');
            }
        } catch (error) {
            console.error('TTS Error:', error);
            console.log('❌ TTS failed - no fallback available');
        }
    }

    showPlanetInfo(planet) {
        const planetTitle = document.getElementById('planetTitle');
        const planetDescription = document.getElementById('planetDescription');
        const infoPanel = document.getElementById('infoPanel');

        if (planetTitle) {
            planetTitle.setAttribute('value', planet.name);
        }

        if (planetDescription) {
            planetDescription.setAttribute('value', planet.description);
        }

        if (infoPanel) {
            infoPanel.setAttribute('visible', 'true');
        }

        // Update desktop UI
        const desktopTitle = document.getElementById('desktopTitle');
        const desktopDescription = document.getElementById('desktopDescription');
        
        if (desktopTitle) {
            desktopTitle.textContent = planet.name;
        }
        
        if (desktopDescription) {
            desktopDescription.textContent = planet.description;
        }
    }

    highlightPlanet(planetId) {
        // Remove previous highlights
        const planets = document.querySelectorAll('.planet');
        planets.forEach(planet => {
            planet.setAttribute('material', 'color', this.getPlanetColor(planet.getAttribute('data-planet-id')));
        });

        // Highlight selected planet
        const selectedPlanet = document.querySelector(`[data-planet-id="${planetId}"]`);
        if (selectedPlanet) {
            selectedPlanet.setAttribute('material', 'color', '#00ff88');
        }
    }

    getPlanetColor(planetId) {
        const colors = {
            'sun': '#FDB813',
            'mercury': '#A0522D',
            'venus': '#E6BE8A',
            'earth': '#6B93D6',
            'mars': '#CD5C5C',
            'jupiter': '#D8CA9D',
            'saturn': '#FAD5A5',
            'uranus': '#B3E4E3',
            'neptune': '#5B5DDF',
            'pluto': '#C0C0C0'
        };
        return colors[planetId] || '#ffffff';
    }

    navigateToPreviousPlanet() {
        if (!this.currentPlanet) {
            console.log('No planet selected, skipping navigation');
            return;
        }

        const currentIndex = this.planets.findIndex(p => p.id === this.currentPlanet.id);
        const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.planets.length - 1;
        this.selectPlanet(this.planets[previousIndex].id);
    }

    navigateToNextPlanet() {
        if (!this.currentPlanet) {
            console.log('No planet selected, skipping navigation');
            return;
        }

        const currentIndex = this.planets.findIndex(p => p.id === this.currentPlanet.id);
        const nextIndex = currentIndex < this.planets.length - 1 ? currentIndex + 1 : 0;
        this.selectPlanet(this.planets[nextIndex].id);
    }

    startVoiceCommand() {
        if (window.voiceManager) {
            window.voiceManager.startListening();
        }
    }

    async speakPlanetInfo() {
        // 🛑 GUARD: Check if TTS is busy or selection is disabled
        if (window.ttsBusy) {
            console.log('🛑 speakPlanetInfo: TTS busy, skipping');
            return;
        }
        
        if (window.selectionDisabled) {
            console.log('🛑 speakPlanetInfo: selection disabled, skipping');
            return;
        }
        
        if (window.tourActive) {
            console.log('🛑 speakPlanetInfo: tour active, skipping');
            return;
        }
        
        if (this.currentPlanet) {
            try {
                // Always use Sarvam TTS for all languages
                const text = this.currentPlanet.description;
                const language = this.currentLanguage;
                
                console.log(`🎤 Speaking planet info in ${language}: ${text.substring(0, 50)}...`);
                
                // Always use Sarvam TTS via ttsManager
                if (window.ttsManager && window.ttsManager.fetchServerTTS) {
                    console.log(`🎯 Using Sarvam TTS for ${language}`);
                    await window.ttsManager.fetchServerTTS(text, language);
                    console.log(`✅ Sarvam TTS completed for ${language}`);
                } else {
                    throw new Error('TTS Manager not available');
                }
            } catch (error) {
                console.error('❌ Sarvam TTS Error:', error);
                console.log('❌ TTS failed - no fallback available');
            }
        }
    }

    // Removed getEnhancedTTS and playAudio functions - now using only Sarvam TTS via ttsManager

    showLanguageSelector() {
        // Create a simple language selector modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: #1a1a2e;
            padding: 30px;
            border-radius: 15px;
            border: 2px solid #00ff88;
            max-width: 400px;
            width: 90%;
        `;

        content.innerHTML = `
            <h3 style="color: #00ff88; margin-bottom: 20px;">Select Language</h3>
            <select id="languageSelect" style="width: 100%; padding: 10px; margin-bottom: 20px; background: #2a2a3e; color: white; border: 1px solid #00ff88; border-radius: 5px;">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="hi">हिंदी</option>
                <option value="kn">ಕನ್ನಡ</option>
                <option value="ta">தமிழ்</option>
                <option value="te">తెలుగు</option>
                <option value="mr">मराठी</option>
                <option value="bn">বাংলা</option>
            </select>
            <div style="display: flex; gap: 10px;">
                <button id="confirmLanguage" style="flex: 1; padding: 10px; background: #00ff88; color: #1a1a2e; border: none; border-radius: 5px; cursor: pointer;">Confirm</button>
                <button id="cancelLanguage" style="flex: 1; padding: 10px; background: #ff4444; color: white; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Set current language
        const select = document.getElementById('languageSelect');
        select.value = this.currentLanguage;

        // Event listeners
        document.getElementById('confirmLanguage').addEventListener('click', () => {
            this.setLanguage(select.value);
            document.body.removeChild(modal);
        });

        document.getElementById('cancelLanguage').addEventListener('click', () => {
            document.body.removeChild(modal);
        });
    }

    setLanguage(languageCode) {
        this.currentLanguage = languageCode;
        localStorage.setItem('solarlearn-language', languageCode);
        
        // Update VR UI
        const currentLanguageText = document.getElementById('currentLanguage');
        if (currentLanguageText) {
            currentLanguageText.setAttribute('value', this.getLanguageName(languageCode));
        }

        // Show notification
        this.showNotification(`Language changed to ${this.getLanguageName(languageCode)}`);
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Español',
            'fr': 'Français',
            'de': 'Deutsch',
            'hi': 'हिंदी',
            'kn': 'ಕನ್ನಡ',
            'ta': 'தமிழ்',
            'te': 'తెలుగు',
            'mr': 'मराठी',
            'bn': 'বাংলা'
        };
        return languages[code] || code;
    }

    loadLanguageFromSession() {
        const vrLanguage = sessionStorage.getItem('vr-language');
        const desktopLanguage = sessionStorage.getItem('desktop-language');
        const savedLanguage = localStorage.getItem('solarlearn-language');
        
        if (vrLanguage) {
            this.currentLanguage = vrLanguage;
        } else if (desktopLanguage) {
            this.currentLanguage = desktopLanguage;
        } else if (savedLanguage) {
            this.currentLanguage = savedLanguage;
        }

        this.updateLanguageDisplay();
    }

    updateLanguageDisplay() {
        const currentLanguageText = document.getElementById('currentLanguage');
        if (currentLanguageText) {
            currentLanguageText.setAttribute('value', this.getLanguageName(this.currentLanguage));
        }
    }

    showDesktopUI() {
        const desktopUI = document.getElementById('desktopUI');
        if (desktopUI) {
            desktopUI.style.display = 'block';
            console.log('Desktop UI shown');
        }
        
        // Also hide VR-specific elements
        const vrUI = document.getElementById('vrUI');
        if (vrUI) {
            vrUI.setAttribute('visible', 'false');
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            console.log('Loading screen hidden');
        }
    }

    // Add timeout to hide loading screen after 10 seconds
    setupLoadingTimeout() {
        setTimeout(() => {
            console.log('Loading timeout reached, forcing hide');
            this.hideLoadingScreen();
        }, 3000); // Reduced from 10 seconds to 3 seconds
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });

        // Set background color based on type
        if (type === 'error') {
            notification.style.background = '#ff4444';
        } else if (type === 'success') {
            notification.style.background = '#00ff88';
            notification.style.color = '#1a1a2e';
        } else {
            notification.style.background = '#00d4ff';
        }

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Translation method
    async translateText(text, sourceLang, targetLang) {
        try {
            const response = await fetch('http://localhost:8080/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: text,
                    sourceLang: sourceLang,
                    targetLang: targetLang
                })
            });

            if (!response.ok) {
                throw new Error(`Translation request failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.translatedText) {
                console.log(`Translation successful: "${text}" -> "${result.translatedText}"`);
                return result.translatedText;
            } else {
                throw new Error('Translation response invalid');
            }
        } catch (error) {
            console.error('Translation error:', error);
            throw error;
        }
    }

    // Utility methods
    getCurrentPlanet() {
        return this.currentPlanet;
    }

    getPlanets() {
        return this.planets;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}

// Initialize VR scene when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.vrSceneController = new VRSceneController();
});
