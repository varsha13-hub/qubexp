// Human Anatomy VR Scene Controller
class AnatomySceneController {
    constructor() {
        this.currentSystem = null;
        this.currentLanguage = 'en';
        this.isVRMode = false;
        this.sceneLoaded = false;
        this.animationInProgress = false;
        this.systemsSeparated = false;
        
        // Scene states
        this.SCENE_STATES = {
            FULL_BODY: 'fullBody',
            SEPARATED: 'separated',
            SYSTEM_FOCUS: 'systemFocus'
        };
        this.currentSceneState = this.SCENE_STATES.FULL_BODY;
        
        this.init();
    }

    init() {
        console.log('🦴 Initializing Human Anatomy VR Scene...');
        this.setupEventListeners();
        this.setupVRSupport();
        this.setupVRControls();
        
        // Start with full body view
        this.showFullBody();
        
        // Auto-start separation animation after 2 seconds
        setTimeout(() => {
            this.startSeparationAnimation();
        }, 2000);
        
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

    setupVRControls() {
        // Add gaze controls for VR interaction
        const bodySystems = document.querySelectorAll('.body-system');
        bodySystems.forEach(system => {
            system.setAttribute('geometry', 'primitive: box; width: 0.1; height: 0.1; depth: 0.1');
            system.setAttribute('material', 'opacity: 0; transparent: true');
            system.setAttribute('cursor-listener', '');
            system.setAttribute('animation__hover', 'property: scale; to: 1.1 1.1 1.1; startEvents: mouseenter; stopEvents: mouseleave');
        });
    }

    showFullBody() {
        console.log('👤 Showing full human body');
        const fullBody = document.querySelector('#fullBody');
        const bodySystems = document.querySelector('#bodySystems');
        
        if (fullBody) fullBody.setAttribute('visible', 'true');
        if (bodySystems) bodySystems.setAttribute('visible', 'false');
        
        this.currentSceneState = this.SCENE_STATES.FULL_BODY;
        this.moveCameraToPosition(0, 1.6, 4);
    }

    startSeparationAnimation() {
        if (this.animationInProgress) return;
        
        console.log('🎬 Starting body separation animation...');
        this.animationInProgress = true;
        
        // Hide full body
        const fullBody = document.querySelector('#fullBody');
        if (fullBody) {
            fullBody.setAttribute('animation__fadeout', {
                property: 'material.opacity',
                to: 0,
                dur: 1000,
                easing: 'easeInOutQuad'
            });
        }
        
        // Show separated systems with animation
        setTimeout(() => {
            this.showSeparatedSystems();
        }, 1000);
    }

    showSeparatedSystems() {
        console.log('🦴 Showing separated body systems');
        const bodySystems = document.querySelector('#bodySystems');
        
        if (bodySystems) {
            bodySystems.setAttribute('visible', 'true');
            
            // Animate each system appearing
            const systems = bodySystems.querySelectorAll('.body-system');
            systems.forEach((system, index) => {
                system.setAttribute('animation__appear', {
                    property: 'scale',
                    from: '0 0 0',
                    to: '1 1 1',
                    dur: 800,
                    delay: index * 200,
                    easing: 'easeOutElastic'
                });
                
                // Add subtle hover animation
                system.setAttribute('animation__hover', {
                    property: 'position',
                    to: `${system.getAttribute('position').x} ${system.getAttribute('position').y + 0.1} ${system.getAttribute('position').z}`,
                    dur: 2000,
                    direction: 'alternate',
                    loop: true,
                    easing: 'easeInOutSine'
                });
            });
        }
        
        this.currentSceneState = this.SCENE_STATES.SEPARATED;
        this.systemsSeparated = true;
        this.animationInProgress = false;
        
        // Move camera to overview position
        this.moveCameraToPosition(0, 2, 6);
        
        // Play introduction narration
        this.speakSystemInfo({
            en: "Welcome to the human body! Here you can see all the major systems separated. Click on any system to learn more about it.",
            hi: "मानव शरीर में आपका स्वागत है! यहाँ आप सभी प्रमुख प्रणालियों को अलग-अलग देख सकते हैं। किसी भी प्रणाली पर क्लिक करके उसके बारे में और जानें।",
            kn: "ಮಾನವ ದೇಹಕ್ಕೆ ಸ್ವಾಗತ! ಇಲ್ಲಿ ನೀವು ಎಲ್ಲಾ ಪ್ರಮುಖ ವ್ಯವಸ್ಥೆಗಳನ್ನು ಪ್ರತ್ಯೇಕವಾಗಿ ನೋಡಬಹುದು. ಯಾವುದೇ ವ್ಯವಸ್ಥೆಯ ಬಗ್ಗೆ ಹೆಚ್ಚು ತಿಳಿಯಲು ಅದರ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ।",
            ta: "மனித உடலுக்கு வரவேற்கிறோம்! இங்கே நீங்கள் அனைத்து முக்கிய அமைப்புகளையும் தனித்தனியாக பார்க்கலாம். எந்த அமைப்பைப் பற்றியும் மேலும் அறிய அதைக் கிளிக் செய்யவும்।",
            te: "మానవ శరీరానికి స్వాగతం! ఇక్కడ మీరు అన్ని ప్రధాన వ్యవస్థలను వేరుగా చూడవచ్చు. ఏ వ్యవస్థ గురించి అయినా మరింత తెలుసుకోవడానికి దానిపై క్లిక్ చేయండి।",
            mr: "मानवी शरीरात आपले स्वागत आहे! येथे आपण सर्व प्रमुख प्रणाली वेगळ्या पाहू शकता. कोणत्याही प्रणालीबद्दल अधिक जाणून घेण्यासाठी त्यावर क्लिक करा.",
            bn: "মানবদেহে স্বাগতম! এখানে আপনি সমস্ত প্রধান সিস্টেম আলাদা আলাদা দেখতে পারেন। যেকোনো সিস্টেম সম্পর্কে আরও জানতে সেটিতে ক্লিক করুন।"
        });
    }

    loadSystem(systemName) {
        console.log(`🦴 Loading ${systemName} system...`);
        
        const system = anatomyData[systemName];
        if (!system) {
            console.error(`❌ System ${systemName} not found`);
            return;
        }

        this.currentSystem = systemName;
        this.currentSceneState = this.SCENE_STATES.SYSTEM_FOCUS;
        
        // Highlight selected system
        this.highlightSystem(systemName);
        
        // Move camera to focus position
        this.moveCameraToFocus(system.focus);
        
        // Start narration in current language
        this.speakSystemInfo(system.narration);
        
        // Update UI
        this.updateSystemDisplay(systemName);
        
        console.log(`✅ ${systemName} system loaded`);
    }

    highlightSystem(systemName) {
        // Remove highlight from all systems
        const allSystems = document.querySelectorAll('.body-system');
        allSystems.forEach(system => {
            system.setAttribute('material', 'opacity: 1');
            system.removeAttribute('animation__highlight');
        });
        
        // Highlight selected system
        const selectedSystem = document.querySelector(`#${systemName}`);
        if (selectedSystem) {
            selectedSystem.setAttribute('animation__highlight', {
                property: 'material.emissive',
                to: '#444444',
                dur: 1000,
                direction: 'alternate',
                loop: true,
                easing: 'easeInOutSine'
            });
        }
    }

    moveCameraToPosition(x, y, z) {
        const cameraRig = document.querySelector('#cameraRig');
        if (!cameraRig) return;

        console.log(`📷 Moving camera to: ${x}, ${y}, ${z}`);
        
        cameraRig.setAttribute('animation__move', {
            property: 'position',
            to: `${x} ${y} ${z}`,
            dur: 2000,
            easing: 'easeInOutQuad'
        });
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
        console.log(`📷 Moving camera to focus position: ${focusPosition.x}, ${focusPosition.y}, ${focusPosition.z}`);
        this.moveCameraToPosition(focusPosition.x, focusPosition.y, focusPosition.z);
    }

    returnToAllSystems() {
        console.log('🔄 Returning to all systems view');
        this.currentSystem = null;
        this.currentSceneState = this.SCENE_STATES.SEPARATED;
        
        // Remove highlights
        const allSystems = document.querySelectorAll('.body-system');
        allSystems.forEach(system => {
            system.removeAttribute('animation__highlight');
        });
        
        // Move camera back to overview position
        this.moveCameraToPosition(0, 2, 6);
        
        // Play return narration
        this.speakSystemInfo({
            en: "You are now viewing all body systems. Select any system to learn more about it.",
            hi: "अब आप सभी शरीर प्रणालियों को देख रहे हैं। किसी भी प्रणाली के बारे में और जानने के लिए उसे चुनें।",
            kn: "ಈಗ ನೀವು ಎಲ್ಲಾ ದೇಹ ವ್ಯವಸ್ಥೆಗಳನ್ನು ನೋಡುತ್ತಿದ್ದೀರಿ. ಯಾವುದೇ ವ್ಯವಸ್ಥೆಯ ಬಗ್ಗೆ ಹೆಚ್ಚು ತಿಳಿಯಲು ಅದನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
            ta: "இப்போது நீங்கள் அனைத்து உடல் அமைப்புகளையும் பார்க்கிறீர்கள். எந்த அமைப்பைப் பற்றியும் மேலும் அறிய அதைத் தேர்ந்தெடுக்கவும்.",
            te: "ఇప్పుడు మీరు అన్ని శరీర వ్యవస్థలను చూస్తున్నారు. ఏ వ్యవస్థ గురించి అయినా మరింత తెలుసుకోవడానికి దానిని ఎంచుకోండి.",
            mr: "आता तुम्ही सर्व शरीर प्रणाली पाहत आहात. कोणत्याही प्रणालीबद्दल अधिक जाणून घेण्यासाठी ती निवडा.",
            bn: "এখন আপনি সমস্ত শরীরের সিস্টেম দেখছেন। যেকোনো সিস্টেম সম্পর্কে আরও জানতে সেটি নির্বাচন করুন।"
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
        // Update menu title
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
        
        // Show/hide appropriate buttons
        const systemButtons = document.querySelector('#systemButtons');
        const controlButtons = document.querySelector('#controlButtons');
        
        if (this.currentSceneState === this.SCENE_STATES.SYSTEM_FOCUS) {
            // Show back button, hide system selection buttons
            if (systemButtons) systemButtons.style.display = 'none';
            if (controlButtons) controlButtons.style.display = 'block';
        } else {
            // Show system selection buttons, hide back button
            if (systemButtons) systemButtons.style.display = 'block';
            if (controlButtons) controlButtons.style.display = 'none';
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

function returnToAllSystems() {
    if (window.anatomyController) {
        window.anatomyController.returnToAllSystems();
    } else {
        console.error('❌ Anatomy controller not initialized');
    }
}

// VR Interaction Handlers
function setupVRInteractions() {
    // Add click handlers for VR gaze interaction
    const bodySystems = document.querySelectorAll('.body-system');
    bodySystems.forEach(system => {
        system.addEventListener('click', () => {
            const systemName = system.id;
            console.log(`🎯 VR Click detected on ${systemName}`);
            loadSystem(systemName);
        });
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.anatomyController = new AnatomySceneController();
    
    // Setup VR interactions after a short delay
    setTimeout(() => {
        setupVRInteractions();
    }, 1000);
});
