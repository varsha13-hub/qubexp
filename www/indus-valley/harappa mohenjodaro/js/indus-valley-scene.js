class IndusValleyScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.vrButton = null;
        this.clock = new THREE.Clock();
        
        // Scene objects
        this.cityObjects = [];
        this.hotspots = [];
        this.npcs = [];
        this.audioListener = null;
        this.sounds = {};
        
        // 3D Model loader
        this.gltfLoader = null;
        this.houseModel = null;
        
        // Performance optimization
        this.lodObjects = [];
        this.frustum = new THREE.Frustum();
        this.cameraMatrix = new THREE.Matrix4();
        
        // Movement and physics
        this.gravity = -9.82;
        this.raycaster = new THREE.Raycaster();
        
        // City dimensions (based on historical Mohenjo-Daro) - Made bigger
        this.cityWidth = 400; // Doubled the width
        this.cityHeight = 400; // Doubled the height
        this.streetWidth = 15; // Increased for proper roads
        this.houseSize = 12;
        
        this.init();
    }
    
    init() {
        try {
            console.log('Initializing Indus Valley Scene...');
            
            this.createScene();
            console.log('Scene created');
            
            this.createCamera();
            console.log('Camera created');
            
            this.createRenderer();
            console.log('Renderer created');
            
            this.createControls();
            console.log('Controls created');
            
            this.createVRButton();
            console.log('VR Button created');
            
            this.createLighting();
            console.log('Lighting created');
            
            this.initializeGLTFLoader();
            console.log('GLTF Loader initialized');
            
            this.createCity();
            console.log('City created');
            
            this.createNPCs();
            console.log('NPCs created');
            
            this.createAudio();
            console.log('Audio created');
            
            this.setupUI();
            console.log('UI setup complete');
            
            this.animate();
            console.log('Animation started');
            
            // Hide loading screen
            setTimeout(() => {
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {
                    loadingElement.style.display = 'none';
                    console.log('Loading screen hidden');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error initializing scene:', error);
            const loadingElement = document.getElementById('loading');
            if (loadingElement) {
                loadingElement.innerHTML = 'Error initializing 3D scene: ' + error.message;
            }
        }
    }
    
    createScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        // Fog removed for clear visibility in hot Indus Valley climate
    }
    
    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        // Set camera at human eye level (1.7m) and position at city entrance
        this.camera.position.set(-90, 1.7, 0);
        this.camera.lookAt(0, 1.7, 0);
    }
    
    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.xr.enabled = true;
        document.getElementById('container').appendChild(this.renderer.domElement);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createControls() {
        this.setupFirstPersonControls();
    }
    
    setupFirstPersonControls() {
        // Simple movement controls
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Camera setup for top-down view - adjusted for bigger city
        this.camera.position.set(0, 80, 0); // Higher up for bigger city view
        this.camera.lookAt(0, 0, 0); // Look down at the city
        
        // Movement speed
        this.moveSpeed = 2.0;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Simple keyboard events
        document.addEventListener('keydown', (event) => {
            console.log('Key pressed:', event.code);
            switch (event.code) {
                case 'ArrowUp':
                    this.moveForward = true;
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.moveLeft = true;
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    this.moveBackward = true;
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.moveRight = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowUp':
                    this.moveForward = false;
                    event.preventDefault();
                    break;
                case 'ArrowLeft':
                    this.moveLeft = false;
                    event.preventDefault();
                    break;
                case 'ArrowDown':
                    this.moveBackward = false;
                    event.preventDefault();
                    break;
                case 'ArrowRight':
                    this.moveRight = false;
                    event.preventDefault();
                    break;
            }
        });
        
        // Mouse events for camera control
        let isMouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        this.renderer.domElement.addEventListener('mousedown', (event) => {
            isMouseDown = true;
            mouseX = event.clientX;
            mouseY = event.clientY;
        });
        
        this.renderer.domElement.addEventListener('mouseup', () => {
            isMouseDown = false;
        });
        
        this.renderer.domElement.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                // Rotate camera around the city
                this.camera.position.x += deltaX * 0.01;
                this.camera.position.z += deltaY * 0.01;
                this.camera.lookAt(0, 0, 0);
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }
        });
        
        // Make canvas focusable
        this.renderer.domElement.setAttribute('tabindex', '0');
        this.renderer.domElement.focus();
    }
    
    createVRButton() {
        if (typeof VRButton !== 'undefined') {
            this.vrButton = VRButton.createButton(this.renderer);
            document.getElementById('ui').appendChild(this.vrButton);
            console.log('VR Button created successfully');
        } else {
            console.log('VRButton not available, VR features disabled');
            // Hide VR button if not available
            const vrButton = document.getElementById('enter-vr');
            if (vrButton) {
                vrButton.style.display = 'none';
            }
        }
    }
    
    createLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 25);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    initializeGLTFLoader() {
        console.log('Initializing GLTF Loader...');
        if (typeof THREE.GLTFLoader !== 'undefined') {
            this.gltfLoader = new THREE.GLTFLoader();
            console.log('GLTF Loader initialized successfully');
            this.loadHouseModel();
        } else {
            console.error('GLTFLoader not available! THREE.GLTFLoader is undefined');
            console.log('Available THREE loaders:', Object.keys(THREE).filter(key => key.includes('Loader')));
        }
    }
    
    loadHouseModel() {
        this.gltfLoader.load(
            'models/ancient_houses.glb',
            (gltf) => {
                console.log('House model loaded successfully');
                this.houseModel = gltf.scene;
                
                // Scale the model appropriately
                this.houseModel.scale.setScalar(2.0);
                
                // Enable shadows and increase brightness
                this.houseModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Increase brightness of the model
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(mat => {
                                    if (mat.color) {
                                        mat.color.multiplyScalar(1.5); // Increase brightness by 50%
                                    }
                                });
                            } else {
                                if (child.material.color) {
                                    child.material.color.multiplyScalar(1.5); // Increase brightness by 50%
                                }
                            }
                        }
                    }
                });
                
                // Recreate houses with the loaded model
                this.recreateHousesWithModel();
            },
            (progress) => {
                console.log('Loading house model...', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('Error loading house model:', error);
                console.log('Falling back to procedural houses');
            }
        );
    }
    
    createCity() {
        console.log('=== CREATING CITY ===');
        this.createGround();
        this.createCityWall();
        this.createCanal();
        this.createCitadel();
        this.createLowerTown();
        this.createStreetGrid();
        this.createHotspots();
    }
    
    createGround() {
        // Create a large brown ground plane covering the entire city area
        const groundGeometry = new THREE.PlaneGeometry(this.cityWidth, this.cityHeight);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Brown color for ground
            transparent: true,
            opacity: 0.9
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.set(0, 0, 0);
        ground.receiveShadow = true;
        ground.name = 'mainGround';
        this.scene.add(ground);
        this.cityObjects.push(ground);
        console.log('Brown ground created covering the entire city area');
    }
    
    // Ground texture loading removed - no grass patches
    
    // Ground creation methods removed - no grass patches
    
    // Ground patch methods removed - no grass patches
    
    // Ground texture to open areas removed - no grass patches
    
    // Ground coverage methods removed - no grass patches
    
    // Final ground patches removed - no grass patches
    
    // Procedural ground removed - no grass patches
    
    createCityWall() {
        // Load the Nimrud palace panels 3D model for the city walls
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/panels_3__4_nimrud_nw_palace.glb',
                (gltf) => {
                    const wallModel = gltf.scene;
                    
                    // Citadel wall positions - completely joined wall with entrance gap (door height)
                    const wallPositions = [
                        // South wall of Citadel - completely joined wall with entrance gap
                        { x: -300, z: -100, rotation: 0, width: 260, height: 32 }, // Left segment - extends to left edge of city
                        { x: -40, z: -100, rotation: 0, width: 40, height: 32 },  // Left gap filler - connects to entrance
                        { x: 40, z: -100, rotation: 0, width: 40, height: 32 },   // Right gap filler - connects to entrance
                        { x: 100, z: -100, rotation: 0, width: 260, height: 32 }   // Right segment - extends to right edge of city
                    ];
                    
                    wallPositions.forEach(pos => {
                        // Clone the wall model for each wall segment
                        const wallClone = wallModel.clone();
                        
                        // Scale the wall model to match the required dimensions (door height)
                        // Adjust scale based on the wall dimensions - height matches door
                        const scaleX = pos.rotation === 0 ? pos.width / 10 : 3 / 10; // Width or thickness (2x)
                        const scaleY = pos.height / 10; // Height matches door (32/10 = 3.2)
                        const scaleZ = pos.rotation === 0 ? 3 / 10 : pos.width / 10; // Thickness or width (2x)
                        
                        wallClone.scale.set(scaleX, scaleY, scaleZ);
                        wallClone.position.set(pos.x, pos.height/2, pos.z);
                        wallClone.rotation.y = pos.rotation;
                        
                        // Configure shadows and materials - keep original brown color
                        wallClone.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            // Keep original brown color - no brightness change
                                            mat.color.multiplyScalar(1.0); // Original brightness
                                        } 
                                    });
                                } else {
                                    if (child.material.color) { 
                                        // Keep original brown color - no brightness change
                                        child.material.color.multiplyScalar(1.0); // Original brightness
                                    }
                                }
                                }
                            }
                        });
                        
                        this.scene.add(wallClone);
                        this.cityObjects.push(wallClone);
                    });
                    
                    // Create entrance gate structure
                    this.createEntranceGate(0, 8, -100);
                    
                    console.log('City walls created with Nimrud palace panels 3D model and entrance gate');
                },
                (progress) => { 
                    console.log('Loading city wall model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading Nimrud palace panels model:', error); 
                    console.log('Falling back to procedural city walls');
                    this.createProceduralCityWall();
                }
            );
        } else {
            // Fallback to procedural if GLTF loader not available
            this.createProceduralCityWall();
        }
    }
    
    createProceduralCityWall() {
        // Create the city wall around the Citadel (following the town plan exactly)
        const wallHeight = 32; // Height matches door height
        const wallThickness = 3;
        
        // Citadel wall positions - only the front wall with entrance
        const wallPositions = [
            // South wall of Citadel - split into two segments with entrance gap
            { x: -150, z: -50, rotation: 0, width: 130 }, // Left segment - extends to left edge of city
            { x: 50, z: -50, rotation: 0, width: 130 }   // Right segment - extends to right edge of city
        ];
        
        wallPositions.forEach(pos => {
            const wallGeometry = new THREE.BoxGeometry(
                pos.rotation === 0 ? pos.width : wallThickness,
                wallHeight,
                pos.rotation === 0 ? wallThickness : pos.width
            );
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(pos.x, wallHeight/2, pos.z);
            wall.rotation.y = pos.rotation;
            wall.castShadow = true;
            this.scene.add(wall);
            this.cityObjects.push(wall);
        });
        
        // Create entrance gate structure for procedural fallback
        this.createEntranceGate(0, 8, -100);
    }
    
    createEntranceGate(x, y, z) {
        const gateGroup = new THREE.Group();
        
        // Create realistic doorframe entrance - positioned in front of Great Bath
        // The Great Bath is at (-30, 8, -190), so we position the arch to align with it (2x scale)
        const archX = -30; // Align with Great Bath X position (2x)
        const archY = y;
        const archZ = z;
        
        // Realistic doorframe dimensions (2x scale)
        const doorWidth = 24; // Wider door opening (2x)
        const doorHeight = 32; // Taller door opening (2x)
        const frameThickness = 3; // Thicker frame (2x)
        const doorThickness = 0.6; // Realistic door thickness (2x)
        
        // Create realistic doorframe structure
        // Left doorframe pillar
        const leftPillarGeometry = new THREE.BoxGeometry(frameThickness, doorHeight, frameThickness);
        const pillarMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown color
        
        const leftPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
        leftPillar.position.set(archX - doorWidth/2 - frameThickness/2, archY + doorHeight/2, archZ);
        leftPillar.castShadow = true;
        gateGroup.add(leftPillar);
        
        // Right doorframe pillar
        const rightPillar = new THREE.Mesh(leftPillarGeometry, pillarMaterial);
        rightPillar.position.set(archX + doorWidth/2 + frameThickness/2, archY + doorHeight/2, archZ);
        rightPillar.castShadow = true;
        gateGroup.add(rightPillar);
        
        // Top doorframe lintel
        const lintelGeometry = new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, frameThickness);
        const lintel = new THREE.Mesh(lintelGeometry, pillarMaterial);
        lintel.position.set(archX, archY + doorHeight + frameThickness/2, archZ);
        lintel.castShadow = true;
        gateGroup.add(lintel);
        
        // Bottom doorframe threshold
        const thresholdGeometry = new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, frameThickness);
        const threshold = new THREE.Mesh(thresholdGeometry, pillarMaterial);
        threshold.position.set(archX, archY - frameThickness/2, archZ);
        threshold.castShadow = true;
        gateGroup.add(threshold);
        
        // Create realistic double doors that fill the entire doorframe
        const doorGeometry = new THREE.BoxGeometry(doorWidth/2 - 0.1, doorHeight - 0.2, doorThickness);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 }); // Dark brown doors
        
        // Left door panel
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(archX - doorWidth/4, archY + doorHeight/2, archZ + doorThickness/2);
        leftDoor.castShadow = true;
        gateGroup.add(leftDoor);
        
        // Right door panel
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(archX + doorWidth/4, archY + doorHeight/2, archZ + doorThickness/2);
        rightDoor.castShadow = true;
        gateGroup.add(rightDoor);
        
        // Add door panels/boards for realistic wood texture
        const panelGeometry = new THREE.BoxGeometry(doorWidth/2 - 0.3, 2, 0.1);
        const panelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Lighter brown for panels
        
        // Left door panels (3 horizontal panels)
        for (let i = 0; i < 3; i++) {
            const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            leftPanel.position.set(archX - doorWidth/4, archY + 3 + i * 4, archZ + doorThickness/2 + 0.05);
            gateGroup.add(leftPanel);
        }
        
        // Right door panels (3 horizontal panels)
        for (let i = 0; i < 3; i++) {
            const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            rightPanel.position.set(archX + doorWidth/4, archY + 3 + i * 4, archZ + doorThickness/2 + 0.05);
            gateGroup.add(rightPanel);
        }
        
        // Realistic door handles (ring-style handles)
        const handleGeometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 }); // Gold
        
        // Left door handle
        const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        leftHandle.position.set(archX - doorWidth/4 - 0.2, archY + doorHeight/2, archZ + doorThickness/2 + 0.1);
        leftHandle.rotation.y = Math.PI / 2;
        gateGroup.add(leftHandle);
        
        // Right door handle
        const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        rightHandle.position.set(archX + doorWidth/4 + 0.2, archY + doorHeight/2, archZ + doorThickness/2 + 0.1);
        rightHandle.rotation.y = Math.PI / 2;
        gateGroup.add(rightHandle);
        
        // Door hinges (decorative)
        const hingeGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.2);
        const hingeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown hinges
        
        // Left door hinges (top and bottom)
        const leftTopHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftTopHinge.position.set(archX - doorWidth/4, archY + doorHeight - 1, archZ);
        leftTopHinge.rotation.z = Math.PI / 2;
        gateGroup.add(leftTopHinge);
        
        const leftBottomHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
        leftBottomHinge.position.set(archX - doorWidth/4, archY + 1, archZ);
        leftBottomHinge.rotation.z = Math.PI / 2;
        gateGroup.add(leftBottomHinge);
        
        // Right door hinges (top and bottom)
        const rightTopHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightTopHinge.position.set(archX + doorWidth/4, archY + doorHeight - 1, archZ);
        rightTopHinge.rotation.z = Math.PI / 2;
        gateGroup.add(rightTopHinge);
        
        const rightBottomHinge = new THREE.Mesh(hingeGeometry, hingeMaterial);
        rightBottomHinge.position.set(archX + doorWidth/4, archY + 1, archZ);
        rightBottomHinge.rotation.z = Math.PI / 2;
        gateGroup.add(rightBottomHinge);
        
        // Decorative doorframe molding
        const moldingGeometry = new THREE.BoxGeometry(doorWidth + frameThickness * 2 + 0.2, 0.3, 0.3);
        const moldingMaterial = new THREE.MeshLambertMaterial({ color: 0xDAA520 }); // Golden rod
        
        // Top molding
        const topMolding = new THREE.Mesh(moldingGeometry, moldingMaterial);
        topMolding.position.set(archX, archY + doorHeight + frameThickness + 0.15, archZ);
        gateGroup.add(topMolding);
        
        // Side moldings
        const sideMoldingGeometry = new THREE.BoxGeometry(0.3, doorHeight + 0.2, 0.3);
        
        const leftSideMolding = new THREE.Mesh(sideMoldingGeometry, moldingMaterial);
        leftSideMolding.position.set(archX - doorWidth/2 - frameThickness - 0.15, archY + doorHeight/2, archZ);
        gateGroup.add(leftSideMolding);
        
        const rightSideMolding = new THREE.Mesh(sideMoldingGeometry, moldingMaterial);
        rightSideMolding.position.set(archX + doorWidth/2 + frameThickness + 0.15, archY + doorHeight/2, archZ);
        gateGroup.add(rightSideMolding);
        
        gateGroup.position.set(0, 0, 0);
        this.scene.add(gateGroup);
        this.cityObjects.push(gateGroup);
        
        // Add hotspot for the realistic doorframe entrance
        this.addHotspot(archX, archY + doorHeight/2, archZ, "Realistic Doorframe Entrance", 
            "This detailed doorframe entrance features realistic wooden doors with panels, " +
            "golden handles, decorative moldings, and proper hinges. The doors fill the entire " +
            "doorframe opening, providing access to the Great Bath area with authentic " +
            "Indus Valley architectural details.");
    }
    
    createCanal() {
        // Create a simple river using basic Three.js geometry
        console.log('Creating simple river with basic geometry...');
        
        // Create a simple straight flowing river with animation (original size)
        const riverGeometry = new THREE.PlaneGeometry(500, 60); // Long and wide straight river (original)
        
        // Create water material with flowing animation
        const riverMaterial = new THREE.MeshLambertMaterial({
            color: 0x87CEEB, // Light blue water color (sky blue)
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        // Create river mesh
        const riverMesh = new THREE.Mesh(riverGeometry, riverMaterial);
        
        // Position the straight river horizontally across the city
        riverMesh.position.set(0, 0.1, 0); // Center of the city
        riverMesh.rotation.x = -Math.PI / 2; // Make it horizontal
        
        // Store reference for animation
        this.riverMesh = riverMesh;
        
        // Add to scene
        this.scene.add(riverMesh);
        this.cityObjects.push(riverMesh);
        
        // Add water animation model on top of the river
        this.addWaterAnimationToRiver();
        
        console.log('Created straight flowing river with animation');
        
        console.log('Straight river created successfully');
        
        // Add hotspot for canal
        this.addHotspot(0, 5, 0, "River/Canal", 
            "The wide river/canal separated the Citadel (administrative area) from the Lower Town (residential area). " +
            "This natural barrier provided both protection and water management for the city.");
        
    }
    
    addWaterLayerToRiver() {
        // Create light blue semi-transparent water layer that follows the exact same pattern as the river
        // This will be placed on top of the brown river model
        
        console.log('Starting to add water layer to river...');
        
        // Load the same german river model for the water layer
        this.gltfLoader.load(
            'models/german_river.glb',
            (gltf) => {
                console.log('Water layer model loaded successfully');
                const waterModel = gltf.scene;
                
                // Configure the water model to be light blue and semi-transparent
                waterModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false; // Water doesn't cast shadows
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach((mat, index) => {
                                    // Set to light blue semi-transparent water color
                                    if (mat.color) {
                                        mat.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                    }
                                    // Make it semi-transparent
                                    mat.transparent = true;
                                    mat.opacity = 0.6;
                                        mat.side = THREE.DoubleSide; // Render both sides for transparency
                                    mat.needsUpdate = true;
                                });
                            } else {
                                // Set to light blue semi-transparent water color
                                if (child.material.color) {
                                    child.material.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                }
                                // Make it semi-transparent
                                child.material.transparent = true;
                                child.material.opacity = 0.6;
                                    child.material.side = THREE.DoubleSide; // Render both sides for transparency
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                });
                
                // Position the main water segment exactly like the river
                waterModel.position.set(0, 0.2, 0); // Slightly higher than the brown river
                waterModel.rotation.y = Math.PI / 2; // Rotate 90 degrees to make it horizontal
                this.scene.add(waterModel);
                this.cityObjects.push(waterModel);
                console.log('Main water segment added to scene');
                
                // Extend the water by repeating the model with the exact same positions as the river
                const waterPositions = [
                    { x: -50, z: 0 },   // Left extension (touching the center)
                    { x: 50, z: 0 },    // Right extension (touching the center)
                    { x: -100, z: 0 },  // Far left extension
                    { x: 100, z: 0 },   // Far right extension
                    { x: -150, z: 0 },  // Very far left
                    { x: 150, z: 0 },   // Very far right
                    { x: -200, z: 0 },  // Extreme left
                    { x: 200, z: 0 }    // Extreme right
                ];
                
                waterPositions.forEach(pos => {
                    const waterClone = waterModel.clone();
                    waterClone.position.set(pos.x, 0.2, pos.z); // Same height as main water, slightly above brown river
                    waterClone.rotation.y = Math.PI / 2; // Keep horizontal orientation
                    
                    // Configure water materials for cloned segments
                    waterClone.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = false; // Water doesn't cast shadows
                            child.receiveShadow = true;
                            
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        // Set to light blue semi-transparent water color for cloned segments too
                                        if (mat.color) {
                                            mat.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                        }
                                        mat.transparent = true;
                                        mat.opacity = 0.6;
                                            mat.side = THREE.DoubleSide;
                                        mat.needsUpdate = true;
                                    });
                                } else {
                                    // Set to light blue semi-transparent water color for cloned segments too
                                    if (child.material.color) {
                                        child.material.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                    }
                                    child.material.transparent = true;
                                    child.material.opacity = 0.6;
                                        child.material.side = THREE.DoubleSide;
                                    child.material.needsUpdate = true;
                                }
                            }
                        }
                    });
                    
                    this.scene.add(waterClone);
                    this.cityObjects.push(waterClone);
                });
                
                console.log('Light blue semi-transparent water layer added to river - all segments created');
            },
            undefined,
            (error) => { 
                console.error('Error loading water layer model:', error); 
                console.log('Falling back to simple water layer');
                this.createSimpleWaterLayer();
            }
        );
    }

    createZigZagWaterLayer() {
        // Create water layer that follows the exact same zig-zag pattern as the brown river
        console.log('Creating zig-zag water layer that follows the river pattern...');
        
        // Load the same german river model for the water layer
        this.gltfLoader.load(
            'models/german_river.glb',
            (gltf) => {
                console.log('Zig-zag water model loaded successfully');
                const waterModel = gltf.scene;
                
                // Configure the water model to be light blue and semi-transparent
                waterModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = false; // Water doesn't cast shadows
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach((mat, index) => {
                                    // Set to light blue semi-transparent water color
                                    if (mat.color) {
                                        mat.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                    }
                                    // Make it semi-transparent
                                    mat.transparent = true;
                                    mat.opacity = 0.7;
                                    mat.side = THREE.DoubleSide; // Render both sides for transparency
                                    mat.needsUpdate = true;
                                });
                            } else {
                                // Set to light blue semi-transparent water color
                                if (child.material.color) {
                                    child.material.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                }
                                // Make it semi-transparent
                                child.material.transparent = true;
                                child.material.opacity = 0.7;
                                child.material.side = THREE.DoubleSide; // Render both sides for transparency
                                child.material.needsUpdate = true;
                            }
                        }
                    }
                });
                
                // Position the main water segment exactly like the river
                waterModel.position.set(0, 0.2, 0); // Slightly higher than the brown river
                waterModel.rotation.y = Math.PI / 2; // Rotate 90 degrees to make it horizontal
                this.scene.add(waterModel);
                this.cityObjects.push(waterModel);
                console.log('Main zig-zag water segment added to scene');
                
                // Extend the water by repeating the model with the exact same positions as the river
                const waterPositions = [
                    { x: -50, z: 0 },   // Left extension (touching the center)
                    { x: 50, z: 0 },    // Right extension (touching the center)
                    { x: -100, z: 0 },  // Far left extension
                    { x: 100, z: 0 },   // Far right extension
                    { x: -150, z: 0 },  // Very far left
                    { x: 150, z: 0 },   // Very far right
                    { x: -200, z: 0 },  // Extreme left
                    { x: 200, z: 0 }    // Extreme right
                ];
                
                waterPositions.forEach((pos, index) => {
                    const waterClone = waterModel.clone();
                    waterClone.position.set(pos.x, 0.2, pos.z); // Same height as main water, slightly above brown river
                    waterClone.rotation.y = Math.PI / 2; // Keep horizontal orientation
                    
                    // Configure water materials for cloned segments
                    waterClone.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = false; // Water doesn't cast shadows
                            child.receiveShadow = true;
                            
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        // Set to light blue semi-transparent water color for cloned segments too
                                        if (mat.color) {
                                            mat.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                        }
                                        mat.transparent = true;
                                        mat.opacity = 0.7;
                                        mat.side = THREE.DoubleSide;
                                        mat.needsUpdate = true;
                                    });
                                } else {
                                    // Set to light blue semi-transparent water color for cloned segments too
                                    if (child.material.color) {
                                        child.material.color.setHex(0x87CEEB); // Light blue water color (sky blue)
                                    }
                                    child.material.transparent = true;
                                    child.material.opacity = 0.7;
                                    child.material.side = THREE.DoubleSide;
                                    child.material.needsUpdate = true;
                                }
                            }
                        }
                    });
                    
                    this.scene.add(waterClone);
                    this.cityObjects.push(waterClone);
                    console.log('Added zig-zag water segment', index, 'at position', pos.x, pos.z);
                });
                
                console.log('Zig-zag water layer created - follows exact river pattern');
            },
            undefined,
            (error) => { 
                console.error('Error loading zig-zag water model:', error); 
                console.log('Falling back to simple water layer');
                this.createSimpleWaterLayer();
            }
        );
    }

    createSimpleWaterLayer() {
        // Create a simple water layer using basic geometry if the model fails to load
        console.log('Creating simple water layer...');
        
        // Create multiple water segments to cover the river area
        const waterPositions = [
            { x: -200, z: 0, width: 50 },
            { x: -150, z: 0, width: 50 },
            { x: -100, z: 0, width: 50 },
            { x: -50, z: 0, width: 50 },
            { x: 0, z: 0, width: 50 },
            { x: 50, z: 0, width: 50 },
            { x: 100, z: 0, width: 50 },
            { x: 150, z: 0, width: 50 },
            { x: 200, z: 0, width: 50 }
        ];
        
        waterPositions.forEach((pos, index) => {
            const waterGeometry = new THREE.PlaneGeometry(pos.width, 20);
            const waterMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x87CEEB, // Light blue water color (sky blue)
                transparent: true,
                opacity: 0.7, // More visible
                side: THREE.DoubleSide
            });
            
            const water = new THREE.Mesh(waterGeometry, waterMaterial);
            water.rotation.x = -Math.PI / 2; // Horizontal
            water.position.set(pos.x, 0.3, pos.z); // Higher above the brown river
            water.name = 'simpleWater_' + index;
            
            this.scene.add(water);
            this.cityObjects.push(water);
            console.log('Added water segment', index, 'at position', pos.x, pos.z);
        });
        
        console.log('Simple water layer created with', waterPositions.length, 'segments');
    }
    
    createFallbackRiver() {
        // Create a simple fallback river if the model doesn't load
        const riverGeometry = new THREE.PlaneGeometry(400, 20);
        const riverMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Brown color to match Great Bath
            transparent: true,
            opacity: 0.9 // Slightly more opaque for better visibility
        });
        const river = new THREE.Mesh(riverGeometry, riverMaterial);
        river.rotation.x = -Math.PI / 2;
        river.position.set(0, 0.05, 0); // Slightly above ground
        river.receiveShadow = true;
        river.name = 'fallbackRiver';
        
        this.scene.add(river);
        this.cityObjects.push(river);
        
        // Add light blue water layer for fallback river too
        const waterGeometry = new THREE.PlaneGeometry(400, 20);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, // Light blue water color (sky blue)
            transparent: true,
            opacity: 0.6 // Semi-transparent
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(0, 0.15, 0); // Slightly above the brown river
        water.receiveShadow = true;
        water.name = 'fallbackWater';
        
        this.scene.add(water);
        this.cityObjects.push(water);
        
        console.log('Bright fallback river with water layer created');
        
        // Add hotspot for canal
        this.addHotspot(0, 5, 0, "River/Canal", 
            "The wide river/canal separated the Citadel (administrative area) from the Lower Town (residential area). " +
            "This natural barrier provided both protection and water management for the city.");
    }
    
    createGate(x, z, rotation) {
        const gateGeometry = new THREE.BoxGeometry(1, 6, 8);
        const gateMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const gate = new THREE.Mesh(gateGeometry, gateMaterial);
        gate.position.set(x, 3, z);
        gate.rotation.y = rotation;
        gate.castShadow = true;
        this.scene.add(gate);
        this.cityObjects.push(gate);
    }
    
    createStreetGrid() {
        const streetMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        // Streets in Lower Town (north of river) - matching town plan
        const gridSize = 12 + 15; // houseSize + streetWidth
        for (let x = -180; x <= 180; x += gridSize) { // Expanded range for bigger city
            const streetGeometry = new THREE.PlaneGeometry(15, 140); // Streets only in Lower Town area (z=60 to z=200)
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(x, 0.01, 130); // Centered in Lower Town area (between z=60 and z=200)
            this.scene.add(street);
        }
        
        // Cross streets in Lower Town - only in the house area
        for (let z = 60; z <= 200; z += gridSize) { // Only in Lower Town area
            const streetGeometry = new THREE.PlaneGeometry(360, 15); // Wider streets
            const street = new THREE.Mesh(streetGeometry, streetMaterial);
            street.rotation.x = -Math.PI / 2;
            street.position.set(0, 0.01, z);
            this.scene.add(street);
        }
    }
    
    createLowerTown() {
        // Create houses in Lower Town (north of the river/canal) following the town plan grid exactly
        const houseSize = 12; // Use the class property for consistency
        const streetWidth = 15; // Increased for proper roads
        const gridSize = houseSize + streetWidth;
        
        // Create houses in a dense grid pattern north of the river (Lower Town) - matching town plan
        for (let x = -180; x <= 180; x += gridSize) { // Expanded range for bigger city
            for (let z = 60; z <= 200; z += gridSize) { // Expanded range for bigger city
                // Create houses in the Lower Town area (north of river)
                const house = this.createHouse(x, z);
                this.scene.add(house);
                this.cityObjects.push(house);
            }
        }
        
        // Add wells in the Lower Town
        this.createWells();
        
        // Add temples, schools, and open grounds
        this.createTemples();
        this.createSchools();
        this.createOpenGrounds();
    }
    
    recreateHousesWithModel() {
        if (!this.houseModel) return;
        
        // Remove existing procedural houses
        this.cityObjects.forEach(obj => {
            if (obj.userData && obj.userData.isProceduralHouse) {
                this.scene.remove(obj);
            }
        });
        
        // Filter out procedural houses from cityObjects
        this.cityObjects = this.cityObjects.filter(obj => !(obj.userData && obj.userData.isProceduralHouse));
        
        // Create houses with 3D model
        const housePositions = this.generateHousePositions();
        
        housePositions.forEach(pos => {
            const house = this.createHouseWithModel(pos.x, pos.z);
            this.scene.add(house);
            this.cityObjects.push(house);
        });
        
        console.log('Houses recreated with 3D models');
    }
    
    generateHousePositions() {
        const positions = [];
        const gridSize = this.houseSize + this.streetWidth; // 12 + 15 = 27
        
        for (let x = -this.cityWidth/2 + gridSize/2; x < this.cityWidth/2; x += gridSize) {
            for (let z = -this.cityHeight/2 + gridSize/2; z < this.cityHeight/2; z += gridSize) {
                // Only create houses in Lower Town (north of river) and avoid Citadel area
                if (this.isLowerTownArea(x, z)) {
                    positions.push({ x, z });
                }
            }
        }
        return positions;
    }
    
    isLowerTownArea(x, z) {
        // Houses only in Lower Town area (north of river, z > 30)
        // Avoid Citadel area (south of river, z < 30)
        // Expanded area for bigger city
        return z > 30 && z < 250 && x > -200 && x < 200;
    }
    
    createHouse(x, z) {
        const houseGroup = new THREE.Group();
        
        // Main house structure
        const houseGeometry = new THREE.BoxGeometry(this.houseSize, 4, this.houseSize);
        const houseMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F }); // Baked brick color
        const house = new THREE.Mesh(houseGeometry, houseMaterial);
        house.position.y = 2;
        house.castShadow = true;
        house.receiveShadow = true;
        houseGroup.add(house);
        
        // Flat roof
        const roofGeometry = new THREE.BoxGeometry(this.houseSize + 0.5, 0.2, this.houseSize + 0.5);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 4.1;
        roof.castShadow = true;
        houseGroup.add(roof);
        
        // Courtyard (smaller structure)
        const courtyardGeometry = new THREE.BoxGeometry(this.houseSize * 0.6, 2, this.houseSize * 0.6);
        const courtyard = new THREE.Mesh(courtyardGeometry, houseMaterial);
        courtyard.position.set(this.houseSize * 0.3, 1, this.houseSize * 0.3);
        courtyard.castShadow = true;
        houseGroup.add(courtyard);
        
        houseGroup.position.set(x, 0, z);
        
        // Mark as procedural house
        houseGroup.userData = { isProceduralHouse: true };
        
        // Add to LOD system for performance
        this.lodObjects.push(houseGroup);
        
        return houseGroup;
    }
    
    createHouseWithModel(x, z) {
        if (!this.houseModel) {
            // Fallback to procedural house if model not loaded
            return this.createHouse(x, z);
        }
        
        const houseGroup = new THREE.Group();
        
        // Clone the 3D model
        const houseClone = this.houseModel.clone();
        houseGroup.add(houseClone);
        
        // Position the house
        houseGroup.position.set(x, 0, z);
        
        // Mark as 3D model house
        houseGroup.userData = { is3DModelHouse: true };
        
        // Add to LOD system for performance
        this.lodObjects.push(houseGroup);
        
        return houseGroup;
    }
    
    createCitadel() {
        // Create raised platform for Citadel (following town plan exactly) (2x scale)
        const platformGeometry = new THREE.BoxGeometry(200, 8, 120); // 2x scale
        const platformMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 4, -160); // 2x scale
        this.scene.add(platform);
        this.cityObjects.push(platform);
        
        // Position buildings according to the exact town plan layout:
        // 1. School (far left/west side of Citadel)
        this.createSchool(-70, 8, -160);
        
        // 2. Great Bath (upper-left portion of Citadel, marked as #2 in town plan)
        this.createGreatBath(-30, 8, -190);
        
        // 3. Granary (southeast of Bath)
        this.createGranary(50, 8, -150);
        
        // 4. Assembly Hall (east of Bath) - Replaced with temple ruin model
        this.createTempleRuinAssemblyHall(30, 8, -140);
        
        // 5. Temple (northeast of Assembly Hall)
        this.createTemple(50, 8, -130);
    }
    
    createSchool(x, y, z) {
        const schoolGeometry = new THREE.BoxGeometry(24, 12, 16); // 2x scale
        const schoolMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const school = new THREE.Mesh(schoolGeometry, schoolMaterial);
        school.position.set(x, y + 6, z); // 2x scale
        school.castShadow = true;
        this.scene.add(school);
        this.cityObjects.push(school);
        
        this.addHotspot(x, y + 6, z, "School", 
            "The school was where young people learned reading, writing, and mathematics. " +
            "The Indus Valley people had a sophisticated education system.");
    }
    
    createGreatBath(x, y, z) {
        // Try to load the 3D model first
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/the_great_bath.glb',
                (gltf) => {
                    const bathModel = gltf.scene;
                    
                    // Scale and position the model to match town plan (2x scale)
                    bathModel.scale.setScalar(6.0); // 2x scale for larger city
                    bathModel.position.set(x, y, z);
                    
                    // Configure shadows and materials for realistic appearance
                    bathModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            // Set realistic brick color for bath structure
                                            mat.color.setHex(0x8B4513); // Brown brick color
                                            mat.color.multiplyScalar(1.2); // Slight brightness increase
                                        } 
                                        // Add realistic material properties
                                        mat.roughness = 0.8; // Rough surface for bricks
                                        mat.metalness = 0.1; // Slight metallic sheen
                                        mat.needsUpdate = true;
                                    });
                                } else {
                                    if (child.material.color) { 
                                        // Set realistic brick color for bath structure
                                        child.material.color.setHex(0x8B4513); // Brown brick color
                                        child.material.color.multiplyScalar(1.2); // Slight brightness increase
                                    }
                                    // Add realistic material properties
                                    child.material.roughness = 0.8; // Rough surface for bricks
                                    child.material.metalness = 0.1; // Slight metallic sheen
                                    child.material.needsUpdate = true;
                                }
                            }
                        }
                    });
                    
                    // Add realistic water to the bath
                    this.addRealisticWaterToBath(bathModel, x, y, z);
                    
                    // Add decorative elements around the bath
                    this.addBathDecorations(x, y, z);
                    
                    this.scene.add(bathModel);
                    this.cityObjects.push(bathModel);
                    
                    this.addHotspot(x, y + 8, z, "Great Bath", 
                        "The Great Bath was a large public bathing facility, possibly used for religious ceremonies. " +
                        "It featured a sophisticated drainage system and was built with watertight bricks. " +
                        "Located in the upper-left portion of the Citadel as shown in the town plan.");
                },
                (progress) => { 
                    console.log('Loading Great Bath model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading Great Bath model:', error); 
                    console.log('Falling back to procedural Great Bath');
                    this.createProceduralGreatBath(x, y, z);
                }
            );
        } else {
            // Fallback to procedural if GLTF loader not available
            this.createProceduralGreatBath(x, y, z);
        }
    }
    
    addRealisticWaterToBath(bathModel, x, y, z) {
        // Create semi-transparent light blue water that fills the bath
        const waterGeometry = new THREE.PlaneGeometry(18, 10); // Fill the entire bath
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, // Light blue water color (sky blue)
            transparent: true,
            opacity: 0.6, // Semi-transparent
            side: THREE.DoubleSide
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(x, y + 2.5, z); // Position at water level
        water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        water.receiveShadow = true;
        
        this.scene.add(water);
        this.cityObjects.push(water);
        
        // Add gentle water animation
        this.animateWater(water);
    }
    
    addBathDecorations(x, y, z) {
        // Simplified - no decorative elements, just clean bath structure
        // Only add simple ceremonial steps leading to the bath
        const decorationGroup = new THREE.Group();
        
        // Add ceremonial steps leading to the bath
        for (let i = 0; i < 3; i++) {
            const stepGeometry = new THREE.BoxGeometry(18 - i * 2, 0.3, 1);
            const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown brick
            
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(x, y + i * 0.3, z + 6 + i * 0.5);
            step.castShadow = true;
            decorationGroup.add(step);
        }
        
        this.scene.add(decorationGroup);
        this.cityObjects.push(decorationGroup);
    }
    
    animateWater(water) {
        // Simple water animation
        const animate = () => {
            water.rotation.z += 0.001;
            water.material.opacity = 0.7 + Math.sin(Date.now() * 0.002) * 0.1;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    createProceduralGreatBath(x, y, z) {
        const bathGroup = new THREE.Group();
        
        // Realistic bath structure with proper brick material
        const bathGeometry = new THREE.BoxGeometry(20, 4, 12);
        const bathMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown brick color
        bathMaterial.roughness = 0.8; // Rough brick surface
        bathMaterial.metalness = 0.1; // Slight metallic sheen
        const bath = new THREE.Mesh(bathGeometry, bathMaterial);
        bath.position.set(0, 2, 0);
        bath.castShadow = true;
        bath.receiveShadow = true;
        bathGroup.add(bath);
        
        // Semi-transparent light blue water that fills the bath
        const waterGeometry = new THREE.PlaneGeometry(18, 10);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB, // Light blue water (sky blue)
            transparent: true,
            opacity: 0.6, // Semi-transparent
            side: THREE.DoubleSide
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.set(0, 3.2, 0);
        water.rotation.x = -Math.PI / 2; // Horizontal
        water.receiveShadow = true;
        bathGroup.add(water);
        
        // Add water animation
        this.animateWater(water);
        
        // Realistic ceremonial steps leading to the bath
        for (let i = 0; i < 4; i++) {
            const stepGeometry = new THREE.BoxGeometry(22 - i * 2, 0.4, 2);
            const stepMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown brick
            stepMaterial.roughness = 0.8;
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(0, i * 0.4, 7 + i * 0.5);
            step.castShadow = true;
            bathGroup.add(step);
        }
        
        // Simplified - no decorative columns, frieze, or drainage system
        // Just clean bath structure with water
        
        bathGroup.position.set(x, y, z);
        this.scene.add(bathGroup);
        this.cityObjects.push(bathGroup);
        
        this.addHotspot(x, y + 8, z, "Great Bath", 
            "The Great Bath was a large public bathing facility, possibly used for religious ceremonies. " +
            "It featured a sophisticated drainage system and was built with watertight bricks. " +
            "Located in the upper-left portion of the Citadel as shown in the town plan.");
    }
    
    createGranary(x, y, z) {
        // Try to load the old_village_house.glb 3D model first
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/old_village_house_-_indian_game_asset.glb',
                (gltf) => {
                    const granaryModel = gltf.scene;
                    
                    // Scale and position the model to match granary size (2x scale)
                    granaryModel.scale.setScalar(5.0); // 2x scale for larger city
                    granaryModel.position.set(x, y, z);
                    
                    // Configure shadows and materials
                    granaryModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            mat.color.multiplyScalar(1.4); // Slightly brighter for granary
                                        } 
                                    });
                                } else {
                                    if (child.material.color) { 
                                        child.material.color.multiplyScalar(1.4); // Slightly brighter for granary
                                    }
                                }
                            }
                        }
                    });
                    
                    this.scene.add(granaryModel);
                    this.cityObjects.push(granaryModel);
                    
                    this.addHotspot(x, y + 8, z, "Granary", 
                        "Granaries were used to store surplus grain. They featured raised platforms for ventilation " +
                        "and protection from floods, showing advanced agricultural planning. " +
                        "This structure now uses the old village house model to represent the granary building.");
                },
                (progress) => { 
                    console.log('Loading granary model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading granary model:', error); 
                    console.log('Falling back to procedural granary');
                    this.createProceduralGranary(x, y, z);
                }
            );
        } else {
            // Fallback to procedural if GLTF loader not available
            this.createProceduralGranary(x, y, z);
        }
    }
    
    createProceduralGranary(x, y, z) {
        const granaryGroup = new THREE.Group();
        
        // Raised platform
        const platformGeometry = new THREE.BoxGeometry(25, 2, 15);
        const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const platform = new THREE.Mesh(platformGeometry, platformMaterial);
        platform.position.set(0, 1, 0);
        platform.castShadow = true;
        granaryGroup.add(platform);
        
        // Main granary structure - make it larger and more prominent
        const granaryGeometry = new THREE.BoxGeometry(25, 10, 15);
        const granaryMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const granary = new THREE.Mesh(granaryGeometry, granaryMaterial);
        granary.position.set(0, 6, 0);
        granary.castShadow = true;
        granaryGroup.add(granary);
        
        // Ventilation spaces - make them more visible
        for (let i = 0; i < 4; i++) {
            const ventGeometry = new THREE.BoxGeometry(3, 8, 15);
            const ventMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const vent = new THREE.Mesh(ventGeometry, ventMaterial);
            vent.position.set(-8 + i * 5, 4, 0);
            granaryGroup.add(vent);
        }
        
        granaryGroup.position.set(x, y, z);
        this.scene.add(granaryGroup);
        this.cityObjects.push(granaryGroup);
        
        this.addHotspot(x, y + 10, z, "Granary", 
            "Granaries were used to store surplus grain. They featured raised platforms for ventilation " +
            "and protection from floods, showing advanced agricultural planning.");
    }
    
    createTempleRuinAssemblyHall(x, y, z) {
        // Load the temple ruin 3D model for the Assembly Hall
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/temple_ruin_aquarium_decoration_-_photoscan.glb',
                (gltf) => {
                    const templeModel = gltf.scene;
                    
                    // Scale and position the model to match the scene surroundings (2x scale)
                    templeModel.scale.setScalar(5.0); // 2x scale for larger city
                    templeModel.position.set(x, y, z);
                    
                    // Configure shadows and materials
                    templeModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            mat.color.multiplyScalar(1.3); // Slightly brighter for visibility
                                        } 
                                    });
                                } else {
                                    if (child.material.color) { 
                                        child.material.color.multiplyScalar(1.3); // Slightly brighter for visibility
                                    }
                                }
                            }
                        }
                    });
                    
                    this.scene.add(templeModel);
                    this.cityObjects.push(templeModel);
                    
                    this.addHotspot(x, y + 8, z, "Assembly Hall", 
                        "The Assembly Hall was a large public building where citizens gathered for meetings, " +
                        "ceremonies, and administrative purposes. This structure now uses the temple ruin model " +
                        "to represent the assembly hall building.");
                },
                (progress) => { 
                    console.log('Loading Temple Ruin Assembly Hall model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading Temple Ruin Assembly Hall model:', error); 
                    console.log('Falling back to procedural Assembly Hall');
                    this.createProceduralAssemblyHall(x, y, z);
                }
            );
        } else {
            // Fallback to procedural if GLTF loader not available
            this.createProceduralAssemblyHall(x, y, z);
        }
    }
    
    createProceduralAssemblyHall(x, y, z) {
        const hallGeometry = new THREE.BoxGeometry(20, 8, 15);
        const hallMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const hall = new THREE.Mesh(hallGeometry, hallMaterial);
        hall.position.set(x, y + 4, z);
        hall.castShadow = true;
        this.scene.add(hall);
        this.cityObjects.push(hall);
        
        // Add columns inside - make them more visible
        for (let i = 0; i < 6; i++) {
            const columnGeometry = new THREE.CylinderGeometry(0.8, 0.8, 8);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(x - 6 + i * 2.4, y + 4, z);
            column.castShadow = true;
            this.scene.add(column);
        }
        
        this.addHotspot(x, y + 8, z, "Assembly Hall", 
            "The Assembly Hall was a large public building where citizens gathered for meetings, " +
            "ceremonies, and administrative purposes.");
    }
    
    createTemple(x, y, z) {
        const templeGeometry = new THREE.BoxGeometry(24, 20, 20); // 2x scale
        const templeMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const temple = new THREE.Mesh(templeGeometry, templeMaterial);
        temple.position.set(x, y + 10, z); // 2x scale
        temple.castShadow = true;
        this.scene.add(temple);
        this.cityObjects.push(temple);
        
        // Add a distinctive roof (2x scale)
        const roofGeometry = new THREE.BoxGeometry(28, 4, 24); // 2x scale
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(x, y + 22, z); // 2x scale
        roof.castShadow = true;
        this.scene.add(roof);
        
        this.addHotspot(x, y + 10, z, "Temple", 
            "The temple was the religious center of the city, where people came to worship " +
            "and perform religious ceremonies.");
    }
    
    createColonnades(parentGroup) {
        const columnPositions = [
            { x: -8, z: -5 }, { x: 8, z: -5 },
            { x: -8, z: 5 }, { x: 8, z: 5 }
        ];
        
        columnPositions.forEach(pos => {
            const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4);
            const columnMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(pos.x, 2, pos.z);
            column.castShadow = true;
            parentGroup.add(column);
        });
    }
    
    
    createWells() {
        const wellPositions = [
            // Original wells
            { x: 30, z: 80 },  // Wells in Lower Town (north of river)
            { x: -30, z: 80 },
            { x: 50, z: 100 },
            { x: -50, z: 100 },
            { x: 0, z: 90 },
            // Additional wells for bigger city
            { x: 80, z: 120 },
            { x: -80, z: 120 },
            { x: 120, z: 140 },
            { x: -120, z: 140 },
            { x: 0, z: 160 },
            { x: 60, z: 180 },
            { x: -60, z: 180 },
            { x: 100, z: 200 },
            { x: -100, z: 200 },
            { x: 140, z: 80 },
            { x: -140, z: 80 },
            { x: 160, z: 120 },
            { x: -160, z: 120 }
        ];
        
        wellPositions.forEach(pos => {
            const well = this.createWell(pos.x, pos.z);
            this.scene.add(well);
            this.cityObjects.push(well);
            
            // Add hotspot
            this.addHotspot(pos.x, 3, pos.z, "Well", 
                "Wells provided fresh water to the community. The Indus Valley people were skilled " +
                "in water management and built sophisticated drainage systems.");
        });
    }
    
    createWell(x, z) {
        const wellGroup = new THREE.Group();
        
        // Well structure
        const wellGeometry = new THREE.CylinderGeometry(2, 2, 4);
        const wellMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const well = new THREE.Mesh(wellGeometry, wellMaterial);
        well.position.y = 2;
        well.castShadow = true;
        wellGroup.add(well);
        
        // Water inside
        const waterGeometry = new THREE.CylinderGeometry(1.8, 1.8, 0.5);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0066CC,
            transparent: true,
            opacity: 0.8
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = 0.25;
        wellGroup.add(water);
        
        wellGroup.position.set(x, 0, z);
        return wellGroup;
    }
    
    createTemples() {
        const templePositions = [
            { x: 50, z: 100 },
            { x: -50, z: 120 },
            { x: 100, z: 140 },
            { x: -100, z: 160 },
            { x: 150, z: 180 },
            { x: -150, z: 200 }
        ];
        
        templePositions.forEach(pos => {
            this.loadTempleModel(pos.x, pos.z);
        });
    }
    
    loadTempleModel(x, z) {
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/temple_ruin_aquarium_decoration_-_photoscan.glb',
                (gltf) => {
                    const templeModel = gltf.scene;
                    
                    // Scale and position the temple - same size as houses
                    templeModel.scale.setScalar(0.5); // Smaller scale to match house size
                    templeModel.position.set(x, 0, z);
                    
                    // Configure shadows and materials
                    templeModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            mat.color.multiplyScalar(1.2); 
                                        } 
                                    });
                                } else {
                                    if (child.material.color) { 
                                        child.material.color.multiplyScalar(1.2); 
                                    }
                                }
                            }
                        }
                    });
                    
                    this.scene.add(templeModel);
                    this.cityObjects.push(templeModel);
                    
                    this.addHotspot(x, 8, z, "Temple Ruins", 
                        "Ancient temple ruins scattered throughout the Lower Town. " +
                        "These sacred spaces were important centers of worship and community gathering.");
                },
                (progress) => { 
                    console.log('Loading temple model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading temple model:', error); 
                    this.createProceduralTemple(x, z);
                }
            );
        } else {
            this.createProceduralTemple(x, z);
        }
    }
    
    createProceduralTemple(x, z) {
        const templeGroup = new THREE.Group();
        
        // Temple base
        const baseGeometry = new THREE.BoxGeometry(8, 2, 8);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = 1;
        base.castShadow = true;
        templeGroup.add(base);
        
        // Temple structure
        const templeGeometry = new THREE.BoxGeometry(6, 6, 6);
        const templeMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const temple = new THREE.Mesh(templeGeometry, templeMaterial);
        temple.position.y = 4;
        temple.castShadow = true;
        templeGroup.add(temple);
        
        templeGroup.position.set(x, 0, z);
        this.scene.add(templeGroup);
        this.cityObjects.push(templeGroup);
        
        this.addHotspot(x, 8, z, "Temple Ruins", 
            "Ancient temple ruins scattered throughout the Lower Town. " +
            "These sacred spaces were important centers of worship and community gathering.");
    }
    
    createSchools() {
        const schoolPositions = [
            { x: 80, z: 80 },
            { x: -80, z: 100 },
            { x: 120, z: 120 },
            { x: -120, z: 140 },
            { x: 160, z: 160 },
            { x: -160, z: 180 }
        ];
        
        schoolPositions.forEach(pos => {
            this.loadSchoolModel(pos.x, pos.z);
        });
    }
    
    loadSchoolModel(x, z) {
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/old_village_house_-_indian_game_asset.glb',
                (gltf) => {
                    const schoolModel = gltf.scene;
                    
                    // Scale and position the school - same size as houses
                    schoolModel.scale.setScalar(0.5); // Smaller scale to match house size
                    schoolModel.position.set(x, 0, z);
                    
                    // Configure shadows and materials
                    schoolModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => { 
                                        if (mat.color) { 
                                            mat.color.multiplyScalar(1.3); 
                                        } 
                                    });
                                } else {
                                    if (child.material.color) { 
                                        child.material.color.multiplyScalar(1.3); 
                                    }
                                }
                            }
                        }
                    });
                    
                    this.scene.add(schoolModel);
                    this.cityObjects.push(schoolModel);
                    
                    this.addHotspot(x, 6, z, "School", 
                        "A local school where children learn reading, writing, and mathematics. " +
                        "Education was highly valued in the Indus Valley civilization.");
                },
                (progress) => { 
                    console.log('Loading school model...', (progress.loaded / progress.total * 100) + '%'); 
                },
                (error) => { 
                    console.error('Error loading school model:', error); 
                    this.createProceduralSchool(x, z);
                }
            );
        } else {
            this.createProceduralSchool(x, z);
        }
    }
    
    createProceduralSchool(x, z) {
        const schoolGroup = new THREE.Group();
        
        // School building
        const schoolGeometry = new THREE.BoxGeometry(10, 5, 8);
        const schoolMaterial = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        const school = new THREE.Mesh(schoolGeometry, schoolMaterial);
        school.position.y = 2.5;
        school.castShadow = true;
        schoolGroup.add(school);
        
        // School roof
        const roofGeometry = new THREE.BoxGeometry(11, 0.5, 9);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = 5.25;
        roof.castShadow = true;
        schoolGroup.add(roof);
        
        schoolGroup.position.set(x, 0, z);
        this.scene.add(schoolGroup);
        this.cityObjects.push(schoolGroup);
        
        this.addHotspot(x, 6, z, "School", 
            "A local school where children learn reading, writing, and mathematics. " +
            "Education was highly valued in the Indus Valley civilization.");
    }
    
    createTrees() {
        // Create many trees throughout the city
        const treePositions = [];
        
        // Generate random tree positions in Lower Town area
        for (let i = 0; i < 20; i++) { // Reduced to 20 trees as requested
            const x = (Math.random() - 0.5) * 360; // -180 to 180
            const z = 60 + Math.random() * 140; // 60 to 200
            
            // Avoid placing trees too close to buildings
            if (this.isValidTreePosition(x, z)) {
                treePositions.push({ x, z });
            }
        }
        
        treePositions.forEach(pos => {
            this.loadTreeModel(pos.x, pos.z);
        });
    }
    
    isValidTreePosition(x, z) {
        // Check if position is not too close to existing buildings
        const minDistance = 15;
        
        // Check against house grid
        const gridSize = 27; // houseSize + streetWidth
        const gridX = Math.round(x / gridSize) * gridSize;
        const gridZ = Math.round(z / gridSize) * gridSize;
        
        const distanceToGrid = Math.sqrt((x - gridX) ** 2 + (z - gridZ) ** 2);
        
        return distanceToGrid > minDistance;
    }
    
    loadTreeModel(x, z) {
        if (this.gltfLoader) {
            this.gltfLoader.load(
                'models/maple_tree.glb',
                (gltf) => {
                    const treeModel = gltf.scene;
                    
                    // Scale and position the tree - same size as buildings
                    const scale = 0.4 + Math.random() * 0.2; // Random scale between 0.4 and 0.6 (same size as buildings)
                    treeModel.scale.setScalar(scale);
                    treeModel.position.set(x, 0, z);
                    
                    // Random rotation for variety
                    treeModel.rotation.y = Math.random() * Math.PI * 2;
                    
                    // Configure shadows and materials
                    treeModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });
                    
                    this.scene.add(treeModel);
                    this.cityObjects.push(treeModel);
                },
                (progress) => { 
                    // Silent loading for trees
                },
                (error) => { 
                    console.error('Error loading tree model:', error); 
                    this.createProceduralTree(x, z);
                }
            );
        } else {
            this.createProceduralTree(x, z);
        }
    }
    
    createProceduralTree(x, z) {
        const treeGroup = new THREE.Group();
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 3);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 1.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.SphereGeometry(2, 8, 6);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 4;
        foliage.castShadow = true;
        treeGroup.add(foliage);
        
        treeGroup.position.set(x, 0, z);
        this.scene.add(treeGroup);
        this.cityObjects.push(treeGroup);
    }
    
    createOpenGrounds() {
        // Create open grounds/plazas in the middle of house blocks
        const openGroundPositions = [
            { x: 0, z: 90, size: 40 },      // Central plaza
            { x: 100, z: 120, size: 30 },   // Eastern plaza
            { x: -100, z: 140, size: 30 },  // Western plaza
            { x: 50, z: 180, size: 25 },    // Northern plaza
            { x: -50, z: 200, size: 25 }    // Far northern plaza
        ];
        
        openGroundPositions.forEach(pos => {
            this.createOpenGround(pos.x, pos.z, pos.size);
        });
    }
    
    createOpenGround(x, z, size) {
        const groundGroup = new THREE.Group();
        
        // Open ground base
        const groundGeometry = new THREE.PlaneGeometry(size, size);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513, // Brown color for ground
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0.01;
        ground.receiveShadow = true;
        groundGroup.add(ground);
        
        // Add some decorative elements
        this.addGroundDecorations(groundGroup, size);
        
        groundGroup.position.set(x, 0, z);
        this.scene.add(groundGroup);
        this.cityObjects.push(groundGroup);
        
        this.addHotspot(x, 2, z, "Open Ground", 
            "A public open space used for gatherings, markets, and community activities. " +
            "These areas were important for social interaction in the ancient city.");
    }
    
    addGroundDecorations(groundGroup, size) {
        // Add some decorative elements to the open ground
        const decorationCount = Math.floor(size / 10);
        
        for (let i = 0; i < decorationCount; i++) {
            const decorationGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1);
            const decorationMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const decoration = new THREE.Mesh(decorationGeometry, decorationMaterial);
            
            // Random position within the ground
            decoration.position.set(
                (Math.random() - 0.5) * (size - 4),
                0.5,
                (Math.random() - 0.5) * (size - 4)
            );
            
            decoration.castShadow = true;
            groundGroup.add(decoration);
        }
    }
    
    
    createDrainageSystem() {
        const drainMaterial = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        
        // Main drains along streets
        for (let x = -this.cityWidth/2; x <= this.cityWidth/2; x += this.houseSize + this.streetWidth) {
            const drainGeometry = new THREE.BoxGeometry(1, 0.5, this.cityHeight);
            const drain = new THREE.Mesh(drainGeometry, drainMaterial);
            drain.position.set(x, 0.25, 0);
            this.scene.add(drain);
        }
        
        for (let z = -this.cityHeight/2; z <= this.cityHeight/2; z += this.houseSize + this.streetWidth) {
            const drainGeometry = new THREE.BoxGeometry(this.cityWidth, 0.5, 1);
            const drain = new THREE.Mesh(drainGeometry, drainMaterial);
            drain.position.set(0, 0.25, z);
            this.scene.add(drain);
        }
    }
    
    createHotspots() {
        // Hotspots are created with individual buildings
        // Additional general hotspots can be added here
    }
    
    addHotspot(x, y, z, title, description) {
        const hotspot = {
            position: new THREE.Vector3(x, y, z),
            title: title,
            description: description,
            mesh: null
        };
        
        // Create visual indicator
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xFFD700,
            transparent: true,
            opacity: 0.8
        });
        hotspot.mesh = new THREE.Mesh(geometry, material);
        hotspot.mesh.position.set(x, y, z);
        this.scene.add(hotspot.mesh);
        
        this.hotspots.push(hotspot);
    }
    
    createNPCs() {
        // Create NPCs for different areas
        this.createNPC(0, 1, 10, 'potter'); // Near Great Bath
        this.createNPC(20, 1, 20, 'trader'); // Near granary
        this.createNPC(-20, 1, -30, 'farmer'); // Near market
        this.createNPC(10, 1, 35, 'water_carrier'); // Near well
    }
    
    createNPC(x, y, z, type) {
        const npcGroup = new THREE.Group();
        
        // Simple human figure
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1.5);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB5 }); // Skin color
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        body.castShadow = true;
        npcGroup.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2);
        const head = new THREE.Mesh(headGeometry, bodyMaterial);
        head.position.y = 1.6;
        head.castShadow = true;
        npcGroup.add(head);
        
        // Add type-specific accessories
        this.addNPCAccessories(npcGroup, type);
        
        npcGroup.position.set(x, y, z);
        this.scene.add(npcGroup);
        this.npcs.push({ group: npcGroup, type: type, originalY: y });
    }
    
    addNPCAccessories(npcGroup, type) {
        switch(type) {
            case 'potter':
                // Pottery wheel
                const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2);
                const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.position.set(1, 0.1, 0);
                npcGroup.add(wheel);
                break;
            case 'trader':
                // Trading goods
                const goodsGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                const goodsMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
                const goods = new THREE.Mesh(goodsGeometry, goodsMaterial);
                goods.position.set(1, 0.25, 0);
                npcGroup.add(goods);
                break;
            case 'farmer':
                // Farming tool
                const toolGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1);
                const toolMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
                const tool = new THREE.Mesh(toolGeometry, toolMaterial);
                tool.position.set(0.5, 0.5, 0);
                tool.rotation.z = Math.PI / 4;
                npcGroup.add(tool);
                break;
            case 'water_carrier':
                // Water pot
                const potGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.4);
                const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const pot = new THREE.Mesh(potGeometry, potMaterial);
                pot.position.set(0.5, 0.2, 0);
                npcGroup.add(pot);
                break;
        }
    }
    
    createAudio() {
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        
        // Create ambient sounds
        this.createAmbientSound('market', 0, 0, -40, 0.3);
        this.createAmbientSound('water', 0, 0, 0, 0.2);
    }
    
    createAmbientSound(soundType, x, y, z, volume) {
        const sound = new THREE.PositionalAudio(this.audioListener);
        const audioLoader = new THREE.AudioLoader();
        
        // Create simple tone for demonstration
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(soundType === 'market' ? 200 : 150, audioContext.currentTime);
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        
        sound.setVolume(volume);
        sound.setRefDistance(20);
        sound.setRolloffFactor(1);
        
        const soundMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1),
            new THREE.MeshBasicMaterial({ color: 0x00ff00, visible: false })
        );
        soundMesh.position.set(x, y, z);
        soundMesh.add(sound);
        
        this.scene.add(soundMesh);
        this.sounds[soundType] = sound;
    }
    
    setupUI() {
        // VR Button
        document.getElementById('enter-vr').addEventListener('click', () => {
            if (this.renderer.xr.isPresenting) {
                this.renderer.xr.getSession().end();
            } else {
                navigator.xr.requestSession('immersive-vr').then((session) => {
                    this.renderer.xr.setSession(session);
                });
            }
        });
        
        // Movement instructions
        this.showMovementInstructions();
        
        // Info toggle
        document.getElementById('toggle-info').addEventListener('click', () => {
            this.toggleInfoPanel();
        });
        
        // Close info
        document.getElementById('close-info').addEventListener('click', () => {
            document.getElementById('info-panel').style.display = 'none';
        });
        
        // Hotspot interactions
        this.setupHotspotInteractions();
        
        // Navigation buttons
        this.setupNavigationButtons();
    }
    
    setupNavigationButtons() {
        // Define navigation locations - updated to match town plan exactly
        const locations = {
            'nav-houses': { x: 0, y: 1.7, z: 90, description: 'Lower Town Houses' },
            'nav-houses-north': { x: 0, y: 1.7, z: 150, description: 'Northern Houses' },
            'nav-houses-east': { x: 100, y: 1.7, z: 120, description: 'Eastern Houses' },
            'nav-houses-west': { x: -100, y: 1.7, z: 120, description: 'Western Houses' },
            'nav-school': { x: -35, y: 1.7, z: -80, description: 'School' },
            'nav-bath': { x: -15, y: 1.7, z: -95, description: 'Great Bath' },
            'nav-granary': { x: 25, y: 1.7, z: -75, description: 'Granary' },
            'nav-assembly': { x: 15, y: 1.7, z: -70, description: 'Assembly Hall' },
            'nav-temple': { x: 25, y: 1.7, z: -65, description: 'Temple' },
            'nav-wall': { x: 0, y: 1.7, z: -80, description: 'City Wall' },
            'nav-canal': { x: 0, y: 1.7, z: 0, description: 'River/Canal' },
            'nav-open-ground': { x: 0, y: 1.7, z: 90, description: 'Central Open Ground' }
        };
        
        // Add event listeners for each navigation button
        Object.keys(locations).forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    const location = locations[buttonId];
                    this.teleportToLocation(location);
                });
            }
        });
    }
    
    teleportToLocation(location) {
        // Smooth camera movement to the location
        const startPosition = this.camera.position.clone();
        const targetPosition = new THREE.Vector3(location.x, location.y, location.z);
        
        // Create animation for smooth teleportation
        const duration = 2000; // 2 seconds
        const startTime = Date.now();
        
        const animateTeleport = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth movement
            const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            const easedProgress = easeInOutCubic(progress);
            
            // Interpolate position
            this.camera.position.lerpVectors(startPosition, targetPosition, easedProgress);
            
            if (progress < 1) {
                requestAnimationFrame(animateTeleport);
            } else {
                // Show location description
                this.showLocationInfo(location.description);
            }
        };
        
        animateTeleport();
    }
    
    showLocationInfo(description) {
        // Create temporary info display
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 18px;
            z-index: 1000;
            text-align: center;
        `;
        infoDiv.textContent = `📍 ${description}`;
        document.body.appendChild(infoDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (infoDiv.parentNode) {
                infoDiv.parentNode.removeChild(infoDiv);
            }
        }, 3000);
    }
    
    setupHotspotInteractions() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        this.renderer.domElement.addEventListener('click', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            
            // Check for hotspot intersections
            this.hotspots.forEach(hotspot => {
                const intersects = raycaster.intersectObject(hotspot.mesh);
                if (intersects.length > 0) {
                    this.showHotspotInfo(hotspot);
                }
            });
        });
    }
    
    showHotspotInfo(hotspot) {
        document.getElementById('info-title').textContent = hotspot.title;
        document.getElementById('info-content').textContent = hotspot.description;
        document.getElementById('info-panel').style.display = 'block';
    }
    
    toggleInfoPanel() {
        const panel = document.getElementById('info-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }
    
    showMovementInstructions() {
        // Show movement instructions in the info panel
        const infoContent = document.getElementById('info-content');
        if (infoContent) {
            infoContent.innerHTML = `
                <strong>Controls:</strong><br>
                • ↑ Arrow: Move camera forward<br>
                • ↓ Arrow: Move camera backward<br>
                • ← Arrow: Move camera left<br>
                • → Arrow: Move camera right<br>
                • Mouse: Click and drag to rotate view<br>
                • Click on golden hotspots for information<br><br>
                <strong>Explore the ancient city of Mohenjo-Daro from above!</strong>
            `;
        }
    }
    
    updateMovement(deltaTime) {
        // Simple camera movement for top-down view
        const moveStep = this.moveSpeed;
        
        // Move camera around the city
        if (this.moveForward) {
            this.camera.position.z -= moveStep;
            console.log('Moving forward');
        }
        if (this.moveBackward) {
            this.camera.position.z += moveStep;
            console.log('Moving backward');
        }
        if (this.moveLeft) {
            this.camera.position.x -= moveStep;
            console.log('Moving left');
        }
        if (this.moveRight) {
            this.camera.position.x += moveStep;
            console.log('Moving right');
        }
        
        // Keep camera looking at the city center
        this.camera.lookAt(0, 0, 0);
        
        // Keep camera at reasonable height - adjusted for bigger city
        this.camera.position.y = Math.max(30, Math.min(150, this.camera.position.y));
        
        // Boundary limits - expanded for bigger city
        const boundary = 180;
        this.camera.position.x = Math.max(-boundary, Math.min(boundary, this.camera.position.x));
        this.camera.position.z = Math.max(-boundary, Math.min(boundary, this.camera.position.z));
    }
    
    checkCollision() {
        const playerPos = this.yawObject.position;
        const playerRadius = 1.5; // Player collision radius
        
        // Check collision with city objects (buildings, walls, etc.)
        for (let obj of this.cityObjects) {
            if (obj.geometry && obj.geometry.type === 'BoxGeometry') {
                const box = new THREE.Box3().setFromObject(obj);
                
                // Expand box by player radius
                box.min.x -= playerRadius;
                box.min.z -= playerRadius;
                box.max.x += playerRadius;
                box.max.z += playerRadius;
                
                if (box.containsPoint(playerPos)) {
                    console.log('Collision with city object at:', playerPos);
                    return true;
                }
            }
        }
        
        // Check collision with houses (both procedural and 3D models)
        for (let house of this.lodObjects) {
            if (house.visible && (house.userData.isProceduralHouse || house.userData.is3DModelHouse)) {
                const box = new THREE.Box3().setFromObject(house);
                
                // Expand box by player radius
                box.min.x -= playerRadius;
                box.min.z -= playerRadius;
                box.max.x += playerRadius;
                box.max.z += playerRadius;
                
                if (box.containsPoint(playerPos)) {
                    console.log('Collision with house at:', playerPos);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        
        // Update first-person movement
        this.updateMovement(deltaTime);
        
        // Performance optimizations
        this.updateLOD();
        this.updateFrustumCulling();
        
        // Animate NPCs
        this.animateNPCs(deltaTime);
        
        // Animate hotspots
        this.animateHotspots(deltaTime);
        
        // Animate the water models
        this.animateWaterModels();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }
    
    addWaterAnimationToRiver() {
        // Load water animation model
        const gltfLoader = new THREE.GLTFLoader();
        
        gltfLoader.load('models/water_animation.glb', (gltf) => {
            const originalWaterModel = gltf.scene;
            
            // Create multiple water animation models along the river (original size)
            const numWaterModels = 8; // Number of water models to create (original)
            const riverLength = 500; // Total river length (original)
            const spacing = riverLength / numWaterModels; // Distance between models
            
            for (let i = 0; i < numWaterModels; i++) {
                // Clone the original model for each instance
                const waterModel = originalWaterModel.clone();
                
                // Scale the water model to fit exactly within the river boundaries (original size)
                // River is 500 units long and 60 units wide, so scale accordingly
                waterModel.scale.set(2, 0.6, 0.6); // Original scale
                
                // Position each water model along the river length
                const xPosition = (i * spacing) - (riverLength / 2) + (spacing / 2);
                waterModel.position.set(xPosition, 0.2, 0); // Slightly above the river surface
                
                // Make the water model semi-transparent
                waterModel.traverse((child) => {
                    if (child.isMesh) {
                        child.material = child.material.clone(); // Clone material to avoid conflicts
                        child.material.transparent = true;
                        child.material.opacity = 0.7;
                        child.material.side = THREE.DoubleSide;
                        
                        // Make it look more like water
                        child.material.color.setHex(0x0066CC); // More vibrant blue
                        child.material.roughness = 0.1;
                        child.material.metalness = 0.0;
                    }
                });
                
                // Add to scene
                this.scene.add(waterModel);
                this.cityObjects.push(waterModel);
            }
            
            // Store references to all water models for animation
            this.waterAnimationModels = [];
            for (let i = 0; i < numWaterModels; i++) {
                this.waterAnimationModels.push(this.scene.children[this.scene.children.length - numWaterModels + i]);
            }
            
            console.log(`Added ${numWaterModels} water animation models to river`);
            
        }, undefined, (error) => {
            console.error('Error loading water animation model:', error);
        });
    }
    
    animateWaterModels() {
        if (this.waterAnimationModels && this.waterAnimationModels.length > 0) {
            const time = Date.now() * 0.001; // Convert to seconds
            
            this.waterAnimationModels.forEach((waterModel, index) => {
                if (waterModel) {
                    // Create continuous flowing water animation
                    const flowSpeed = 0.8; // Faster, more continuous flow
                    const waveAmplitude = 0.03; // Smaller, smoother wave motion
                    const waveFrequency = 1.5; // Slower, more continuous waves
                    const flowDistance = 15; // Longer flow distance for continuity
                    
                    // Continuous horizontal flowing motion
                    const originalX = waterModel.position.x;
                    const flowOffset = Math.sin(time * flowSpeed + index * 0.3) * flowDistance;
                    waterModel.position.x = originalX + flowOffset;
                    
                    // Smooth vertical wave motion
                    waterModel.position.y = 0.2 + Math.sin(time * waveFrequency + index * 0.2) * waveAmplitude;
                    
                    // Continuous rotation for flowing effect
                    waterModel.rotation.z = Math.sin(time * 1.2 + index * 0.15) * 0.015;
                    
                    // Animate material properties for continuous flowing effect
                    waterModel.traverse((child) => {
                        if (child.isMesh && child.material) {
                            // Smooth color variation for continuous flowing effect
                            const colorVariation = Math.sin(time * 1.5 + index * 0.25) * 0.08 + 0.92;
                            child.material.color.setRGB(
                                0.0 * colorVariation, // Red component
                                0.4 * colorVariation, // Green component  
                                0.8 * colorVariation  // Blue component
                            );
                            
                            // Smooth opacity variation for continuous wave effect
                            child.material.opacity = 0.7 + Math.sin(time * 2.2 + index * 0.2) * 0.08;
                        }
                    });
                }
            });
        }
    }
    
    
    updateLOD() {
        // Disable LOD system - keep all objects visible
        this.lodObjects.forEach(lodObject => {
                lodObject.visible = true;
                lodObject.scale.setScalar(1.0);
        });
    }
    
    updateFrustumCulling() {
        // Disable frustum culling - keep all objects visible
        this.cityObjects.forEach(obj => {
            obj.visible = true;
        });
    }
    
    animateNPCs(deltaTime) {
        this.npcs.forEach(npc => {
            // Simple floating animation
            npc.group.position.y = npc.originalY + Math.sin(Date.now() * 0.001 + npc.group.position.x) * 0.1;
            
            // Rotate NPCs slowly
            npc.group.rotation.y += deltaTime * 0.1;
        });
    }
    
    animateHotspots(deltaTime) {
        this.hotspots.forEach(hotspot => {
            // Pulsing animation
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            hotspot.mesh.scale.setScalar(scale);
            
            // Rotate slowly
            hotspot.mesh.rotation.y += deltaTime * 0.5;
        });
    }
}

// Initialize the scene when the page loads
window.addEventListener('load', () => {
    new IndusValleyScene();
});
