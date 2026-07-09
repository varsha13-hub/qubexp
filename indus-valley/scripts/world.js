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

        if (this.questsFound === GLOBAL_QUESTS.length) {
            setTimeout(() => {
                window.appUI.showInfoPanel("City Explorer Complete!", "You have found all the historical artifacts in the city!");
                if (window.ttsManager) {
                    window.ttsManager.speak("Congratulations! You have found all artifacts.", window.dataLoader.currentLang);
                }
            }, 3000);
        }
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
