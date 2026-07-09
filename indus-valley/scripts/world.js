/**
 * Open-World Manager for Indus Valley VR
 * Handles global quests, player proximity tracking, and automatic POI narrations.
 */

const POINTS_OF_INTEREST = {
    'entrance': {
        name: 'City Entrance',
        siteKey: 'mohenjo-daro',
        center: { x: 0, z: 30 },
        radius: 15,
        visited: false
    },
    'greatbath': {
        name: 'The Great Bath',
        siteKey: 'mohenjo-daro',
        center: { x: 60, z: -29 },
        radius: 15,
        visited: false
    },
    'granary': {
        name: 'The Great Granary',
        siteKey: 'granary',
        center: { x: -20, z: -55 },
        radius: 15,
        visited: false
    },
    'assembly': {
        name: 'Pillared Assembly Hall',
        siteKey: 'assembly',
        center: { x: 22, z: -55 },
        radius: 15,
        visited: false
    },
    'residential': {
        name: 'Elite Residential Quarters',
        siteKey: 'harappa',
        center: { x: 18, z: 25 },
        radius: 15,
        visited: false
    },
    'craftsmen': {
        name: 'Craftsmen & Workers District',
        siteKey: 'craftsmen',
        center: { x: -22, z: 25 },
        radius: 15,
        visited: false
    }
};

const GLOBAL_QUESTS = [
    { id: 'seal', name: 'Trade Seal', position: '-2 0.5 50', desc: 'A steatite seal used by merchants for trade.' },
    { id: 'weights', name: 'Standard Weights', position: '12 0.5 35', desc: 'Chert weights used for taxation and trade.' },
    { id: 'bitumen', name: 'Bitumen', position: '60 1.2 -30', desc: 'Tar-like substance used to make the bath waterproof.' },
    { id: 'drain', name: 'Corbelled Drain', position: '53.5 0.6 -23', desc: 'Advanced corbelled brick drainage channel that discharged waste water from the Great Bath directly into the main street sewer — one of the world\'s earliest planned sewage outlets.' },
    { id: 'toy', name: 'Terracotta Cart', position: '-22 0.5 20', desc: 'A children\'s toy found in the residential courtyard.' },
    { id: 'well', name: 'Private Well', position: '10 1.5 5', desc: 'Most houses had their own water supply.' },
    { id: 'granary_seal', name: 'Grain Toll Seal', position: '-20 7.5 -55', desc: 'A clay sealing used to verify grain shipments arriving at the Citadel Granary.' },
    { id: 'drain_cap', name: 'Silt Filter Grate', position: '-11 2.2 -55', desc: 'A terracotta mesh used to filter solid waste at street drainage junctions.' },
    { id: 'brick_measure', name: 'Standardized Brick', position: '-25 0.5 45', desc: 'A fired clay brick adhering to the strict 1:2:4 ratio used throughout the civilization.' },
    { id: 'drain_clog', name: 'Clogged Drain Silt', position: '-38.5 0.4 28', desc: 'A thick deposit of silt, ash, and broken pottery sherds blocking a residential lane gutter. Harappan workers regularly cleared these blockages to keep the city sanitary — an early form of municipal maintenance.' }
];

class WorldManager {
    constructor() {
        this.currentPOI = null;
        this.questsFound = 0;
        this.trackerInterval = null;
    }

    start() {
        console.log("🌍 Starting Open World Tracking...");
        this.setupQuests();
        
        // Update UI
        document.getElementById('current-zone-title').textContent = "Exploring the City";

        // Start tracking player position every 500ms
        this.trackerInterval = setInterval(() => this.trackPlayer(), 500);

        // Narrate general welcome
        setTimeout(() => {
            if (window.ttsManager) {
                const civInfo = window.dataLoader.getCivInfo();
                if (civInfo) {
                    window.ttsManager.speak(`Welcome to the Indus Valley. ${civInfo.description}. Explore the city to learn more.`, window.dataLoader.currentLang);
                }
            }
        }, 2000);
    }

    setupQuests() {
        const scene = document.querySelector('a-scene');
        window.appUI.updateQuestTracker(0, GLOBAL_QUESTS.length);

        // Spawn all global quests in the world
        GLOBAL_QUESTS.forEach((quest) => {
            const el = document.createElement('a-entity');
            el.setAttribute('id', `quest-${quest.id}`);
            el.setAttribute('position', quest.position);
            el.setAttribute('geometry', 'primitive: octahedron; radius: 0.4');
            el.setAttribute('material', 'color: #f4a460; metalness: 0.8; roughness: 0.2; emissive: #f4a460; emissiveIntensity: 0.4');
            el.setAttribute('animation__rotate', 'property: rotation; to: 0 360 0; loop: true; dur: 3000; easing: linear');
            el.setAttribute('animation__float', 'property: position; dir: alternate; dur: 1500; loop: true; easing: easeInOutSine; to: ' + this.getFloatPosition(quest.position));
            el.setAttribute('class', 'clickable quest-item');
            
            el.addEventListener('click', () => this.handleQuestClick(quest, el));
            
            scene.appendChild(el);
        });
    }

    getFloatPosition(posStr) {
        const coords = posStr.split(' ').map(Number);
        return `${coords[0]} ${coords[1] + 0.3} ${coords[2]}`;
    }

    handleQuestClick(quest, element) {
        element.setAttribute('visible', 'false');
        element.classList.remove('clickable');
        
        this.questsFound++;
        window.appUI.updateQuestTracker(this.questsFound, GLOBAL_QUESTS.length);
        window.appUI.showNotification(`Found: ${quest.name}`);
        
        if (window.ttsManager) {
            window.ttsManager.speak(`You found the ${quest.name}. ${quest.desc}`, window.dataLoader.currentLang);
        }

        // Spawn actual 3D representation of the artifact
        this.spawn3DArtifact(quest);

        if (this.questsFound === GLOBAL_QUESTS.length) {
            setTimeout(() => {
                window.appUI.showInfoPanel("City Explorer Complete!", "You have found all the historical artifacts in the city!");
                if (window.ttsManager) {
                    window.ttsManager.speak("Congratulations! You have found all artifacts.", window.dataLoader.currentLang);
                }
            }, 3000);
        }
    }

    spawn3DArtifact(quest) {
        const scene = document.querySelector('a-scene');
        if (!scene) return;

        const container = document.createElement('a-entity');
        container.setAttribute('position', quest.position);
        container.setAttribute('id', `artifact-${quest.id}`);
        
        let artifactEl;
        
        // Define distinct 3D representations using A-Frame primitives
        switch(quest.id) {
            case 'seal': // Trade Seal: Flat terracotta clay tablet
                artifactEl = document.createElement('a-box');
                artifactEl.setAttribute('width', '0.5');
                artifactEl.setAttribute('height', '0.5');
                artifactEl.setAttribute('depth', '0.08');
                artifactEl.setAttribute('material', 'src: #brick-texture; color: #b07050; roughness: 1.0');
                break;
                
            case 'weights': // Standard Weights: Grey stone cubic weights
                artifactEl = document.createElement('a-box');
                artifactEl.setAttribute('width', '0.35');
                artifactEl.setAttribute('height', '0.35');
                artifactEl.setAttribute('depth', '0.35');
                artifactEl.setAttribute('material', 'color: #7f8c8d; roughness: 0.9; metalness: 0.1');
                break;
                
            case 'bitumen': // Bitumen: Glossy black tar coating
                artifactEl = document.createElement('a-sphere');
                artifactEl.setAttribute('radius', '0.3');
                artifactEl.setAttribute('material', 'color: #111111; roughness: 0.1; metalness: 0.8');
                break;
                
            case 'drain': // Corbelled Drain: Small brick archway structure
                artifactEl = document.createElement('a-entity');
                
                const leftWall = document.createElement('a-box');
                leftWall.setAttribute('position', '-0.25 0 0');
                leftWall.setAttribute('width', '0.12');
                leftWall.setAttribute('height', '0.4');
                leftWall.setAttribute('depth', '0.5');
                leftWall.setAttribute('material', 'src: #brick-texture; color: #8c5a3a');
                
                const rightWall = document.createElement('a-box');
                rightWall.setAttribute('position', '0.25 0 0');
                rightWall.setAttribute('width', '0.12');
                rightWall.setAttribute('height', '0.4');
                rightWall.setAttribute('depth', '0.5');
                rightWall.setAttribute('material', 'src: #brick-texture; color: #8c5a3a');
                
                const capStone = document.createElement('a-box');
                capStone.setAttribute('position', '0 0.25 0');
                capStone.setAttribute('width', '0.65');
                capStone.setAttribute('height', '0.1');
                capStone.setAttribute('depth', '0.5');
                capStone.setAttribute('material', 'src: #brick-texture; color: #6b4430');
                
                artifactEl.appendChild(leftWall);
                artifactEl.appendChild(rightWall);
                artifactEl.appendChild(capStone);
                break;
                
            case 'toy': // Terracotta Cart: Little brick cart with wheels
                artifactEl = document.createElement('a-entity');
                
                const body = document.createElement('a-box');
                body.setAttribute('width', '0.4');
                body.setAttribute('height', '0.15');
                body.setAttribute('depth', '0.6');
                body.setAttribute('material', 'src: #brick-texture; color: #d2691e');
                
                const wheelLeft = document.createElement('a-cylinder');
                wheelLeft.setAttribute('position', '-0.25 -0.08 0');
                wheelLeft.setAttribute('rotation', '0 0 90');
                wheelLeft.setAttribute('radius', '0.18');
                wheelLeft.setAttribute('height', '0.06');
                wheelLeft.setAttribute('material', 'src: #brick-texture; color: #a0522d');
                
                const wheelRight = document.createElement('a-cylinder');
                wheelRight.setAttribute('position', '0.25 -0.08 0');
                wheelRight.setAttribute('rotation', '0 0 90');
                wheelRight.setAttribute('radius', '0.18');
                wheelRight.setAttribute('height', '0.06');
                wheelRight.setAttribute('material', 'src: #brick-texture; color: #a0522d');
                
                artifactEl.appendChild(body);
                artifactEl.appendChild(wheelLeft);
                artifactEl.appendChild(wheelRight);
                break;
                
            case 'well': // Private Well: Cylinder well
                artifactEl = document.createElement('a-cylinder');
                artifactEl.setAttribute('radius', '0.35');
                artifactEl.setAttribute('height', '0.7');
                artifactEl.setAttribute('open-ended', 'true');
                artifactEl.setAttribute('material', 'src: #brick-texture; color: #8c5a3a; side: double');
                break;
                
            case 'granary_seal': // Grain Toll Seal: Flat clay seal disk
                artifactEl = document.createElement('a-cylinder');
                artifactEl.setAttribute('radius', '0.22');
                artifactEl.setAttribute('height', '0.05');
                artifactEl.setAttribute('rotation', '90 0 0');
                artifactEl.setAttribute('material', 'src: #brick-texture; color: #c08060; roughness: 1.0');
                break;
                
            case 'drain_cap': // Silt Filter Grate: Grated plate
                artifactEl = document.createElement('a-box');
                artifactEl.setAttribute('width', '0.45');
                artifactEl.setAttribute('height', '0.05');
                artifactEl.setAttribute('depth', '0.45');
                artifactEl.setAttribute('material', 'color: #5d4037; roughness: 1.0');
                break;
                
            case 'brick_measure': // Standardized Brick: 1:2:4 ratio brick
                artifactEl = document.createElement('a-box');
                artifactEl.setAttribute('width', '0.25');
                artifactEl.setAttribute('height', '0.12');
                artifactEl.setAttribute('depth', '0.5');
                artifactEl.setAttribute('material', 'src: #brick-texture; color: #8c5a3a; roughness: 1.0');
                break;
                
            case 'drain_clog': // Clogged Drain Silt: Mud mound
                artifactEl = document.createElement('a-sphere');
                artifactEl.setAttribute('radius', '0.32');
                artifactEl.setAttribute('scale', '1 0.5 1');
                artifactEl.setAttribute('material', 'color: #5c4033; roughness: 1.0');
                break;
                
            default:
                artifactEl = document.createElement('a-sphere');
                artifactEl.setAttribute('radius', '0.25');
                artifactEl.setAttribute('material', 'color: #f4a460');
        }
        
        container.appendChild(artifactEl);
        container.setAttribute('animation__rotate', 'property: rotation; to: 0 360 0; loop: true; dur: 8000; easing: linear');
        
        // Add 3D text label above the spawned artifact
        const label = document.createElement('a-text');
        label.setAttribute('value', quest.name);
        label.setAttribute('position', '0 0.7 0');
        label.setAttribute('align', 'center');
        label.setAttribute('color', '#f4a460');
        label.setAttribute('scale', '0.6 0.6 0.6');
        label.setAttribute('width', '4');
        container.appendChild(label);
        
        // Scale-in spawn animation
        container.setAttribute('scale', '0.01 0.01 0.01');
        container.setAttribute('animation__scale', 'property: scale; to: 1 1 1; dur: 800; easing: easeOutBack');
        
        scene.appendChild(container);
    }

    trackPlayer() {
        const rig = document.getElementById('rig');
        if (!rig) return;
        
        const pos = rig.getAttribute('position');
        
        // Find which POI the player is currently inside
        let activePOIKey = null;
        for (const [key, poi] of Object.entries(POINTS_OF_INTEREST)) {
            const dx = pos.x - poi.center.x;
            const dz = pos.z - poi.center.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist <= poi.radius) {
                activePOIKey = key;
                break;
            }
        }

        // Handle POI changes
        if (activePOIKey !== this.currentPOI) {
            this.currentPOI = activePOIKey;
            
            if (activePOIKey) {
                const poi = POINTS_OF_INTEREST[activePOIKey];
                document.getElementById('current-zone-title').textContent = poi.name;
                
                // Only narrate automatically the first time they visit to avoid spamming
                if (!poi.visited) {
                    poi.visited = true;
                    this.narratePOI(poi);
                }
            } else {
                document.getElementById('current-zone-title').textContent = "Exploring the City...";
            }
        }
    }

    narratePOI(poi) {
        const siteData = window.dataLoader.getSiteData(poi.siteKey);
        if (siteData && window.ttsManager) {
            window.appUI.showNotification(`Entering ${poi.name}`);
            const intro = `You have reached ${poi.name}. ${siteData.description}`;
            window.ttsManager.speak(intro, window.dataLoader.currentLang);
        }
    }
}

window.worldManager = new WorldManager();
