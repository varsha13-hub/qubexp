// Human Anatomy VR Scene Controller
class AnatomySceneController {
    constructor() {
        this.currentSystem = null;
        this.currentLanguage = 'en';
        this.isVRMode = false;
        this.sceneLoaded = false;
        
        this.init();
    }

    init() {
        console.log('🦴 Initializing Human Anatomy VR Scene...');
        this.setupEventListeners();
        this.setupVRSupport();
        
        // Load default system
        this.loadSystem('skeletal');
        
        console.log('✅ Human Anatomy VR Scene initialized');
    }

    setupEventListeners() {
        // Listen for VR mode changes
        const scene = document.querySelector('a-scene');
        if (scene) {
            scene.addEventListener('enter-vr', () => {
                console.log('🥽 Entered VR mode');
                this.isVRMode = true;
            });
            
            scene.addEventListener('exit-vr', () => {
                console.log('🖥️ Exited VR mode');
                this.isVRMode = false;
            });
        }
    }

    setupVRSupport() {
        // Check if WebXR is supported
        if ('xr' in navigator) {
            console.log('✅ WebXR supported');
        } else {
            console.log('⚠️ WebXR not supported - desktop mode only');
        }
    }

    loadSystem(systemName) {
        console.log(`🦴 Loading ${systemName} system...`);
        
        const system = anatomyData[systemName];
        if (!system) {
            console.error(`❌ System ${systemName} not found`);
            return;
        }

        this.currentSystem = systemName;
        
        // Hide all models first
        this.hideAllModels();
        
        // Show selected model
        this.showModel(systemName);
        
        // Move camera to focus position
        this.moveCameraToFocus(system.focus);
        
        // Start narration in current language
        this.speakSystemInfo(system.narration);
        
        // Update UI
        this.updateSystemDisplay(systemName);
        
        console.log(`✅ ${systemName} system loaded`);
    }

    hideAllModels() {
        const modelIds = ['skeletal', 'circulatory', 'respiratory', 'digestive', 'nervous', 'muscular', 'reproductive'];
        modelIds.forEach(id => {
            const model = document.querySelector(`#${id}`);
            if (model) {
                model.setAttribute('visible', 'false');
            }
        });
    }

    showModel(systemName) {
        const model = document.querySelector(`#${systemName}`);
        if (model) {
            model.setAttribute('visible', 'true');
            console.log(`👁️ Showing ${systemName} model`);
        }
    }

    moveCameraToFocus(focusPosition) {
        const cameraRig = document.querySelector('#cameraRig');
        if (!cameraRig) return;

        console.log(`📷 Moving camera to focus position: ${focusPosition.x}, ${focusPosition.y}, ${focusPosition.z}`);
        
        // Smooth camera movement
        cameraRig.setAttribute('animation__move', {
            property: 'position',
            to: `${focusPosition.x} ${focusPosition.y} ${focusPosition.z}`,
            dur: 2000,
            easing: 'easeInOutQuad'
        });
    }

    speakSystemInfo(narration) {
        // Get narration in current language
        const text = narration[this.currentLanguage] || narration.en;
        console.log(`🗣️ Speaking in ${this.currentLanguage}: ${text.substring(0, 50)}...`);
        
        // Use the Sarvam TTS system
        if (window.ttsManager) {
            window.ttsManager.speak(text, this.currentLanguage);
        } else {
            console.warn('⚠️ TTS Manager not available');
        }
    }

    updateSystemDisplay(systemName) {
        // Update any UI elements if needed
        const menu = document.querySelector('#menu h3');
        if (menu) {
            const systemNames = {
                'skeletal': '🦴 Skeletal System',
                'circulatory': '❤️ Circulatory System',
                'respiratory': '🫁 Respiratory System',
                'digestive': '🍽️ Digestive System',
                'nervous': '🧠 Nervous System',
                'muscular': '💪 Muscular System',
                'reproductive': '👶 Reproductive System'
            };
            menu.textContent = systemNames[systemName] || systemName;
        }
    }

    setLanguage(language) {
        this.currentLanguage = language;
        console.log(`🌐 Language changed to: ${language}`);
        
        // If a system is currently loaded, re-speak the narration in new language
        if (this.currentSystem) {
            const system = anatomyData[this.currentSystem];
            if (system && system.narration) {
                this.speakSystemInfo(system.narration);
            }
        }
    }
}

// Global functions for button clicks
function loadSystem(systemName) {
    if (window.anatomyController) {
        window.anatomyController.loadSystem(systemName);
    } else {
        console.error('❌ Anatomy controller not initialized');
    }
}

function setLanguage(language) {
    if (window.anatomyController) {
        window.anatomyController.setLanguage(language);
    } else {
        console.error('❌ Anatomy controller not initialized');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.anatomyController = new AnatomySceneController();
});
