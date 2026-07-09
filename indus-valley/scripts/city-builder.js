/**
 * Historically Accurate City Builder
 * Reconstructs the grid-based urban planning of Mohenjo-Daro and Harappa.
 * Features:
 * - Citadel Platform with Great Granary, Assembly Hall, and Fortifications
 * - Hierarchical housing (Elite Courtyard Houses vs. Workers Row Houses)
 * - Complete drainage system (private bathrooms, wall chutes, covered street drains, soak pits)
 */

class CityBuilder {
    constructor() {
        this.container = null;
    }

    generate() {
        console.log("🏗️ Generating Historical City Grid...");
        this.container = document.getElementById('procedural-city-container');
        if (!this.container) return;

        // 1. Build Citadel Infrastructure (North Side: Z < -30)
        this.buildCitadelStructures();

        // 2. Build Walled Enclave for Elite Merchants (East Side: X = 2 to 43, Z = -25 to 90)
        this.buildEliteEnclaveWalls(2, 43, -25, 90);

        // 3. Build Lower Town Residential Blocks (Exact Layout from notebook sketch)
        // Straight Blocks (12 Workers blocks West + 12 Elite Enclave blocks East)
        const straightBlocks = [
            // West Side (Workers District: 12 Blocks)
            // Top West — REMOVED (user request)
            { x: -38, z: -32, w: 12, d: 12, elite: false, skip: true },
            { x: -22, z: -32, w: 12, d: 12, elite: false, skip: true },
            // Column 1 (Far West)
            { x: -38, z: -14, w: 12, d: 14, elite: false, skip: true },
            { x: -38, z: 6,   w: 12, d: 14, elite: false },
            { x: -38, z: 26,  w: 12, d: 14, elite: false },
            { x: -38, z: 46,  w: 12, d: 14, elite: false },
            { x: -38, z: 66,  w: 12, d: 14, elite: false },
            // Column 2 (Mid West)
            { x: -22, z: -14, w: 12, d: 14, elite: false, skip: true },
            { x: -22, z: 6,   w: 12, d: 14, elite: false },
            { x: -22, z: 26,  w: 12, d: 14, elite: false },
            { x: -22, z: 46,  w: 12, d: 14, elite: false },
            { x: -22, z: 66,  w: 12, d: 14, elite: false },

            // East Side (Elite Walled Enclave: 12 Blocks total)
            // Column 1
            { x: 8, z: -18, w: 12, d: 14, elite: true, skip: true },  // REMOVED (user request)
            { x: 8, z: 2,   w: 12, d: 14, elite: true, skip: true }, // skipped for custom courtyard model at X=14, Z=9
            { x: 8, z: 22,  w: 12, d: 14, elite: true },
            { x: 8, z: 42,  w: 12, d: 14, elite: true },
            { x: 8, z: 62,  w: 12, d: 14, elite: true },
            { x: 8, z: 82,  w: 12, d: 14, elite: true },
            // Column 2
            { x: 24, z: -18, w: 12, d: 14, elite: true },
            { x: 24, z: 2,   w: 12, d: 14, elite: true },
            { x: 24, z: 22,  w: 12, d: 14, elite: true },
            { x: 24, z: 42,  w: 12, d: 14, elite: true },
            { x: 24, z: 62,  w: 12, d: 14, elite: true },
            { x: 24, z: 82,  w: 12, d: 14, elite: true }
        ];

        straightBlocks.forEach(b => {
            if (b.skip) return;
            this.buildResidentialBlock(b.x, b.z, b.w, b.d, b.elite);
            // city-wide sewer grid is built once after all blocks
        });

        // Slanted Blocks (Rotated container for East Side: 12 Blocks)
        // Positioned at X = 64 to prevent wall clipping
        const rotatedContainer = document.createElement('a-entity');
        rotatedContainer.setAttribute('position', '64 0 20');
        rotatedContainer.setAttribute('rotation', '0 -15 0');
        this.container.appendChild(rotatedContainer);

        const slantedBlocks = [
            // Column 1
            { x: -6, z: -18, w: 12, d: 14, elite: true },
            { x: -6, z: 2,   w: 12, d: 14, elite: true },
            { x: -6, z: 22,  w: 12, d: 14, elite: true },
            { x: -6, z: 42,  w: 12, d: 14, elite: true },
            { x: -6, z: 62,  w: 12, d: 14, elite: true },
            { x: -6, z: 82,  w: 12, d: 14, elite: true },
            // Column 2
            { x: 10, z: -18, w: 12, d: 14, elite: true },
            { x: 10, z: 2,   w: 12, d: 14, elite: true },
            { x: 10, z: 22,  w: 12, d: 14, elite: true },
            { x: 10, z: 42,  w: 12, d: 14, elite: true },
            { x: 10, z: 62,  w: 12, d: 14, elite: true },
            { x: 10, z: 82,  w: 12, d: 14, elite: true }
        ];

        slantedBlocks.forEach(b => {
            // Calculate approximate global position of this slanted block to prevent Great Bath overlap
            const rad = -15 * Math.PI / 180;
            const cosVal = Math.cos(rad);
            const sinVal = Math.sin(rad);
            
            const localCX = b.x + b.w / 2;
            const localCZ = b.z + b.d / 2;
            
            const globalX = 64 + (localCX * cosVal) - (localCZ * sinVal);
            const globalZ = 20 + (localCX * sinVal) + (localCZ * cosVal);
            
            // Great Bath complex is centered at X = 0, Z = -55.
            // Bounding box of deck is X = -15 to 15, Z = -75 to -35.
            // We skip building if it lies within this boundary
            if (globalX > -15 && globalX < 15 && globalZ > -75 && globalZ < -35) {
                console.log(`🚫 Skipped slanted block (local x=${b.x}, z=${b.z}) to prevent Great Bath overlap (global X=${globalX.toFixed(1)}, Z=${globalZ.toFixed(1)})`);
                return;
            }

            this.buildResidentialBlock(b.x, b.z, b.w, b.d, b.elite, rotatedContainer);
        });

        // 4. Build Settling Basins (Soak Pits) at major street intersections
        this.buildCustomSettlingBasins();

        // 5. Build the city-wide covered street sewer grid
        this.buildCitySewerGrid();

        // 6. Scatter trees, public wells and green grass patches in open areas
        this.buildCityVegetation();
    }

    // ==========================================
    // CITADEL BUILDERS
    // ==========================================

    buildCitadelStructures() {
        console.log("🏰 Building Citadel Infrastructure...");
        
        // Place the Great Granary in the West Citadel (Global: X = -20, Z = -55, Y = 7)
        this.buildGreatGranary(-20, -55);
        
        // Place the Pillared Assembly Hall in the East Citadel (Global: X = 22, Z = -55, Y = 4)
        this.buildAssemblyHall(22, -55);
        
        // Build Citadel Fortification Walls and Corner Bastions
        this.buildCitadelFortifications();
    }

    buildGreatGranary(x, z) {
        const granaryGroup = document.createElement('a-entity');
        granaryGroup.setAttribute('position', `${x} 7.01 ${z}`);
        granaryGroup.setAttribute('id', 'great-granary-structure');
        
        // Main brick foundation platform (sleeper walls)
        // Consists of 9 sleeper walls running parallel to allow air circulation (ventilation shafts)
        const wallLength = 18;
        const wallWidth = 1.0;
        const wallHeight = 1.2;
        const wallGap = 0.8;
        
        for (let i = -4; i <= 4; i++) {
            const sleeper = document.createElement('a-box');
            sleeper.setAttribute('position', `${i * (wallWidth + wallGap)} ${wallHeight/2} 0`);
            sleeper.setAttribute('width', wallWidth);
            sleeper.setAttribute('height', wallHeight);
            sleeper.setAttribute('depth', wallLength);
            sleeper.setAttribute('material', 'src: #brick-texture; repeat: 1 6; roughness: 1.0');
            granaryGroup.appendChild(sleeper);
        }
        
        // Wooden floor planks on top of sleeper walls
        const woodPlatform = document.createElement('a-box');
        woodPlatform.setAttribute('position', `0 ${wallHeight + 0.1} 0`);
        woodPlatform.setAttribute('width', 17);
        woodPlatform.setAttribute('height', 0.2);
        woodPlatform.setAttribute('depth', wallLength);
        woodPlatform.setAttribute('material', 'src: #wood-texture; repeat: 8 8; roughness: 0.9');
        granaryGroup.appendChild(woodPlatform);
        
        // Wooden granary storage bins (superstructures)
        const binSize = 4.5;
        const binHeight = 3;
        const binPositions = [
            { x: -5, z: -4 }, { x: 0, z: -4 }, { x: 5, z: -4 },
            { x: -5, z: 4 },  { x: 0, z: 4 },  { x: 5, z: 4 }
        ];
        
        binPositions.forEach((pos, idx) => {
            const bin = document.createElement('a-box');
            bin.setAttribute('position', `${pos.x} ${wallHeight + 0.2 + binHeight/2} ${pos.z}`);
            bin.setAttribute('width', binSize);
            bin.setAttribute('height', binHeight);
            bin.setAttribute('depth', binSize);
            bin.setAttribute('material', 'src: #wood-texture; color: #a0522d; repeat: 2 2; roughness: 1.0');
            bin.setAttribute('class', 'clickable');
            bin.setAttribute('data-info', `Granary Bin ${idx + 1}: Used for storing barley and wheat reserves. Air ventilation below kept the grains dry.`);
            granaryGroup.appendChild(bin);
        });

        // Loading Ramp for carts
        const ramp = document.createElement('a-box');
        ramp.setAttribute('position', `9.5 ${wallHeight/2} 0`);
        ramp.setAttribute('width', 2);
        ramp.setAttribute('height', 0.2);
        ramp.setAttribute('depth', 6);
        ramp.setAttribute('rotation', '0 0 -20');
        ramp.setAttribute('material', 'src: #wood-texture; repeat: 1 3');
        granaryGroup.appendChild(ramp);

        // ── GRANARY DRAINAGE SYSTEM ─────────────────────────────────────────────
        // The sleeper-wall design not only ventilated grain stores but also allowed
        // rainwater to drain away. Channels between the walls fed a collector gutter
        // along the South edge, which emptied via a sloped outlet chute down
        // the citadel mound to the main street sewer at the base.

        // 1. Water channels between each pair of sleeper walls (8 gaps)
        const gapCenter = wallWidth + wallGap; // 1.8m per slot
        for (let i = -4; i < 4; i++) {
            const chanX = (i + 0.5) * gapCenter; // center of each gap

            // Dark water bed
            const chanWater = document.createElement('a-plane');
            chanWater.setAttribute('position', `${chanX} 0.04 0`);
            chanWater.setAttribute('rotation', '-90 0 0');
            chanWater.setAttribute('width', wallGap - 0.08); // 0.72m wide
            chanWater.setAttribute('height', wallLength);
            chanWater.setAttribute('material', 'color: #2e2018; roughness: 0.1; transparent: true; opacity: 0.88');
            granaryGroup.appendChild(chanWater);

            // Narrow brick lips on the sides of each channel (visual depth)
            [-1, 1].forEach(side => {
                const lip = document.createElement('a-box');
                lip.setAttribute('position', `${chanX + side * (wallGap / 2 - 0.02)} 0.06 0`);
                lip.setAttribute('width', 0.06);
                lip.setAttribute('height', 0.12);
                lip.setAttribute('depth', wallLength);
                lip.setAttribute('material', 'src: #brick-texture; color: #6b4430; repeat: 1 8; roughness: 1.0');
                granaryGroup.appendChild(lip);
            });
        }

        // 2. South collector gutter — runs E-W along the South edge of the granary,
        //    collecting all channel outflows before routing to the outlet chute
        const collectorZ = wallLength / 2 + 0.5; // just South of the granary

        const collGutter = document.createElement('a-plane');
        collGutter.setAttribute('position', `0 0.04 ${collectorZ}`);
        collGutter.setAttribute('rotation', '-90 0 0');
        collGutter.setAttribute('width', 18);
        collGutter.setAttribute('height', 0.9);
        collGutter.setAttribute('material', 'color: #2e2018; roughness: 0.1; transparent: true; opacity: 0.9');
        granaryGroup.appendChild(collGutter);

        // Collector gutter brick walls (N and S)
        ['N', 'S'].forEach((side, idx) => {
            const gwZ = collectorZ + (idx === 0 ? -0.5 : 0.5);
            const gw = document.createElement('a-box');
            gw.setAttribute('position', `0 0.07 ${gwZ}`);
            gw.setAttribute('width', 18);
            gw.setAttribute('height', 0.15);
            gw.setAttribute('depth', 0.1);
            gw.setAttribute('material', 'src: #brick-texture; color: #6b4430; repeat: 12 1; roughness: 1.0');
            granaryGroup.appendChild(gw);
        });

        // 3. Main outlet chute — sloped brick box descending from collector gutter
        //    down the South face of the citadel mound (-7.01 Y relative, ~15m run)
        const chute = document.createElement('a-box');
        chute.setAttribute('position', `0 ${-wallHeight - 3.0} ${collectorZ + 9}`);
        chute.setAttribute('width', 0.8);
        chute.setAttribute('height', 0.15);
        chute.setAttribute('depth', 18);
        chute.setAttribute('rotation', '22 0 0'); // sloped downward
        chute.setAttribute('material', 'src: #brick-texture; color: #5a3c28; repeat: 1 8; roughness: 1.0');
        chute.setAttribute('class', 'clickable');
        chute.setAttribute('data-info', 'Granary Drainage Channel: Rainwater was directed through channels between sleeper walls, collected in a gutter, and drained via this sloped chute down the citadel mound into the main street sewer.');
        granaryGroup.appendChild(chute);

        // Chute water surface
        const chuteWater = document.createElement('a-box');
        chuteWater.setAttribute('position', `0 ${-wallHeight - 2.93} ${collectorZ + 9}`);
        chuteWater.setAttribute('width', 0.55);
        chuteWater.setAttribute('height', 0.04);
        chuteWater.setAttribute('depth', 18);
        chuteWater.setAttribute('rotation', '22 0 0');
        chuteWater.setAttribute('material', 'color: #2e2018; roughness: 0.05; metalness: 0.2; transparent: true; opacity: 0.85');
        granaryGroup.appendChild(chuteWater);
        // ── END GRANARY DRAINAGE SYSTEM ─────────────────────────────────────────

        this.container.appendChild(granaryGroup);

    }

    buildAssemblyHall(x, z) {
        const hallGroup = document.createElement('a-entity');
        hallGroup.setAttribute('position', `${x} 4.01 ${z}`);
        hallGroup.setAttribute('id', 'assembly-hall-structure');
        
        // Large brick-paved floor
        const floor = document.createElement('a-box');
        floor.setAttribute('position', '0 0.1 0');
        floor.setAttribute('width', 22);
        floor.setAttribute('height', 0.2);
        floor.setAttribute('depth', 22);
        floor.setAttribute('material', 'src: #brick-texture; repeat: 11 11; roughness: 1.0');
        hallGroup.appendChild(floor);
        
        // 4x5 Grid of Pillared Columns (Mohenjo-daro Style)
        const pillarHeight = 4.5;
        const pillarRadius = 0.35;
        
        for (let row = -2; row <= 2; row++) {
            for (let col = -1.5; col <= 1.5; col += 1) {
                const pillar = document.createElement('a-cylinder');
                pillar.setAttribute('position', `${col * 5} ${pillarHeight/2 + 0.2} ${row * 4.5}`);
                pillar.setAttribute('radius', pillarRadius);
                pillar.setAttribute('height', pillarHeight);
                pillar.setAttribute('material', 'src: #brick-texture; repeat: 2 6; roughness: 0.9');
                hallGroup.appendChild(pillar);
            }
        }
        
        // Main dais / Raised platform for assembly leaders
        const dais = document.createElement('a-box');
        dais.setAttribute('position', '0 0.6 -9');
        dais.setAttribute('width', 8);
        dais.setAttribute('height', 0.8);
        dais.setAttribute('depth', 3);
        dais.setAttribute('material', 'src: #brick-texture; repeat: 4 1');
        hallGroup.appendChild(dais);
        
        // Flat roof over the pillared hall
        const roof = document.createElement('a-box');
        roof.setAttribute('position', `0 ${pillarHeight + 0.3} 0`);
        roof.setAttribute('width', 23);
        roof.setAttribute('height', 0.3);
        roof.setAttribute('depth', 23);
        roof.setAttribute('material', 'src: #wood-texture; repeat: 10 10; color: #8b5a2b');
        hallGroup.appendChild(roof);
        
        this.container.appendChild(hallGroup);
    }

    buildCitadelFortifications() {
        // Build fortified walls and corner bastions around the Citadel mound (X: -35 to 35, Z: -75 to -35)
        const fortGroup = document.createElement('a-entity');
        fortGroup.setAttribute('id', 'citadel-fortifications');
        
        const bastionPositions = [
            { x: -35, z: -75 }, // NW
            { x: -35, z: -35 }, // SW
            { x: 35, z: -75 },  // NE
            { x: 35, z: -35 }   // SE
        ];
        
        // Corner Bastions (tapered towers)
        bastionPositions.forEach(pos => {
            const tower = document.createElement('a-cylinder');
            tower.setAttribute('position', `${pos.x} 4 ${pos.z}`);
            tower.setAttribute('radius-bottom', 3);
            tower.setAttribute('radius-top', 2.4);
            tower.setAttribute('height', 8);
            tower.setAttribute('material', 'src: #brick-texture; repeat: 6 8; roughness: 1.0');
            
            // Battlements on top of the tower
            const topper = document.createElement('a-cylinder');
            topper.setAttribute('position', `${pos.x} 8.2 ${pos.z}`);
            topper.setAttribute('radius', 2.6);
            topper.setAttribute('height', 0.6);
            topper.setAttribute('material', 'color: #8b4513; roughness: 1.0');
            
            fortGroup.appendChild(tower);
            fortGroup.appendChild(topper);
        });
        
        // Curtain Walls (exposed mud-brick texture)
        const wallThickness = 2.5;
        const wallHeight = 5.5;
        
        // West Wall (X = -35, Z from -75 to -35)
        const westWall = document.createElement('a-box');
        westWall.setAttribute('position', `-35 ${wallHeight/2} -55`);
        westWall.setAttribute('width', wallThickness);
        westWall.setAttribute('height', wallHeight);
        westWall.setAttribute('depth', 36);
        westWall.setAttribute('material', 'src: #brick-texture; repeat: 4 10; roughness: 1.0');
        fortGroup.appendChild(westWall);
        
        // East Wall (X = 35, Z from -75 to -35)
        const eastWall = document.createElement('a-box');
        eastWall.setAttribute('position', `35 ${wallHeight/2} -55`);
        eastWall.setAttribute('width', wallThickness);
        eastWall.setAttribute('height', wallHeight);
        eastWall.setAttribute('depth', 36);
        eastWall.setAttribute('material', 'src: #brick-texture; repeat: 4 10; roughness: 1.0');
        fortGroup.appendChild(eastWall);
 
        // North Wall (Z = -75, X from -35 to 35)
        const northWall = document.createElement('a-box');
        northWall.setAttribute('position', `0 ${wallHeight/2} -75`);
        northWall.setAttribute('width', 66);
        northWall.setAttribute('height', wallHeight);
        northWall.setAttribute('depth', wallThickness);
        northWall.setAttribute('material', 'src: #brick-texture; repeat: 10 4; roughness: 1.0');
        fortGroup.appendChild(northWall);
 
        // South Wall (Z = -35, X from -35 to 35) - Gated opening in the center for the main avenue ramp
        const southWallWest = document.createElement('a-box');
        southWallWest.setAttribute('position', `-20 ${wallHeight/2} -35`);
        southWallWest.setAttribute('width', 26);
        southWallWest.setAttribute('height', wallHeight);
        southWallWest.setAttribute('depth', wallThickness);
        southWallWest.setAttribute('material', 'src: #brick-texture; repeat: 8 4; roughness: 1.0');
        fortGroup.appendChild(southWallWest);
        
        const southWallEast = document.createElement('a-box');
        southWallEast.setAttribute('position', `20 ${wallHeight/2} -35`);
        southWallEast.setAttribute('width', 26);
        southWallEast.setAttribute('height', wallHeight);
        southWallEast.setAttribute('depth', wallThickness);
        southWallEast.setAttribute('material', 'src: #brick-texture; repeat: 8 4; roughness: 1.0');
        fortGroup.appendChild(southWallEast);
 
        this.container.appendChild(fortGroup);
    }

    // ==========================================
    // LOWER TOWN BUILDERS
    // ==========================================

    buildResidentialBlock(startX, startZ, width, depth, isEliteDistrict, parentEl = this.container) {
        // Build the perimeter wall barrier around this block grid sector
        this.buildBlockBoundaryWall(startX, startZ, width, depth, parentEl);

        // Build the open brick lane drains inside the block
        this.buildBlockLaneDrains(startX, startZ, width, depth, parentEl);

        // A block consists of exactly 4 smaller courtyard houses arranged as a 2x2 grid sharing party walls
        const size = 5.0; // 5m small courtyard/row houses

        // NW House (drains West)
        if (isEliteDistrict) {
            this.buildEliteCourtyardHouse(startX + 1.0, startZ + 1.5, size, 'west', parentEl);
        } else {
            this.buildWorkerHouse(startX + 1.0, startZ + 1.5, size, 'west', parentEl);
        }

        // NE House (drains East)
        if (isEliteDistrict) {
            this.buildEliteCourtyardHouse(startX + 6.0, startZ + 1.5, size, 'east', parentEl);
        } else {
            this.buildWorkerHouse(startX + 6.0, startZ + 1.5, size, 'east', parentEl);
        }

        // SW House (drains West)
        if (isEliteDistrict) {
            this.buildEliteCourtyardHouse(startX + 1.0, startZ + 7.5, size, 'west', parentEl);
        } else {
            this.buildWorkerHouse(startX + 1.0, startZ + 7.5, size, 'west', parentEl);
        }

        // SE House (drains East)
        if (isEliteDistrict) {
            this.buildEliteCourtyardHouse(startX + 6.0, startZ + 7.5, size, 'east', parentEl);
        } else {
            this.buildWorkerHouse(startX + 6.0, startZ + 7.5, size, 'east', parentEl);
        }
    }

    buildBlockBoundaryWall(startX, startZ, width, depth, parentEl = this.container) {
        const wallGroup = document.createElement('a-entity');
        const height = 1.8;
        const thick = 0.25;
        
        // North Wall (with a central gateway) — natural gaps at startX+0.5 and startX+11.5 where drains exit
        const nWall1 = document.createElement('a-box');
        nWall1.setAttribute('position', `${startX + width/4} ${height/2} ${startZ}`);
        nWall1.setAttribute('width', width/2 - 1.2);
        nWall1.setAttribute('height', height);
        nWall1.setAttribute('depth', thick);
        nWall1.setAttribute('material', 'src: #brick-texture; repeat: 4 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(nWall1);

        const nWall2 = document.createElement('a-box');
        nWall2.setAttribute('position', `${startX + 3*width/4} ${height/2} ${startZ}`);
        nWall2.setAttribute('width', width/2 - 1.2);
        nWall2.setAttribute('height', height);
        nWall2.setAttribute('depth', thick);
        nWall2.setAttribute('material', 'src: #brick-texture; repeat: 4 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(nWall2);
        
        // South Wall — split into 3 segments with weephole gaps at startX+0.5 and startX+11.5
        // Segment 1 (Far West): width 0.2m
        const sWall1 = document.createElement('a-box');
        sWall1.setAttribute('position', `${startX + 0.1} ${height/2} ${startZ + depth}`);
        sWall1.setAttribute('width', 0.2);
        sWall1.setAttribute('height', height);
        sWall1.setAttribute('depth', thick);
        sWall1.setAttribute('material', 'src: #brick-texture; repeat: 1 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(sWall1);

        // Weephole lintel 1 — spans the West lane drain gap (0.6m wide), suspended at upper half of wall
        const sLintel1 = document.createElement('a-box');
        sLintel1.setAttribute('position', `${startX + 0.5} ${height - 0.4} ${startZ + depth}`);
        sLintel1.setAttribute('width', 0.6);
        sLintel1.setAttribute('height', 0.8);
        sLintel1.setAttribute('depth', thick);
        sLintel1.setAttribute('material', 'src: #brick-texture; repeat: 1 1; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(sLintel1);

        // Segment 2 (Middle): width 10.4m from startX+0.8 to startX+11.2
        const sWall2 = document.createElement('a-box');
        sWall2.setAttribute('position', `${startX + 6.0} ${height/2} ${startZ + depth}`);
        sWall2.setAttribute('width', 10.4);
        sWall2.setAttribute('height', height);
        sWall2.setAttribute('depth', thick);
        sWall2.setAttribute('material', 'src: #brick-texture; repeat: 8 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(sWall2);

        // Weephole lintel 2 — spans the East lane drain gap (0.6m wide)
        const sLintel2 = document.createElement('a-box');
        sLintel2.setAttribute('position', `${startX + 11.5} ${height - 0.4} ${startZ + depth}`);
        sLintel2.setAttribute('width', 0.6);
        sLintel2.setAttribute('height', 0.8);
        sLintel2.setAttribute('depth', thick);
        sLintel2.setAttribute('material', 'src: #brick-texture; repeat: 1 1; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(sLintel2);

        // Segment 3 (Far East): width 0.2m from startX+11.8 to startX+12.0
        const sWall3 = document.createElement('a-box');
        sWall3.setAttribute('position', `${startX + 11.9} ${height/2} ${startZ + depth}`);
        sWall3.setAttribute('width', 0.2);
        sWall3.setAttribute('height', height);
        sWall3.setAttribute('depth', thick);
        sWall3.setAttribute('material', 'src: #brick-texture; repeat: 1 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(sWall3);

        // West Wall
        const wWall = document.createElement('a-box');
        wWall.setAttribute('position', `${startX} ${height/2} ${startZ + depth/2}`);
        wWall.setAttribute('width', thick);
        wWall.setAttribute('height', height);
        wWall.setAttribute('depth', depth);
        wWall.setAttribute('material', 'src: #brick-texture; repeat: 8 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(wWall);

        // East Wall
        const eWall = document.createElement('a-box');
        eWall.setAttribute('position', `${startX + width} ${height/2} ${startZ + depth/2}`);
        eWall.setAttribute('width', thick);
        eWall.setAttribute('height', height);
        eWall.setAttribute('depth', depth);
        eWall.setAttribute('material', 'src: #brick-texture; repeat: 8 2; color: #a6705c; roughness: 1.0');
        wallGroup.appendChild(eWall);
        
        // Gate pillars at the North wall gateway
        const pillar1 = document.createElement('a-box');
        pillar1.setAttribute('position', `${startX + width/2 - 1.2} ${height/2 + 0.2} ${startZ}`);
        pillar1.setAttribute('width', 0.5);
        pillar1.setAttribute('height', height + 0.4);
        pillar1.setAttribute('depth', 0.5);
        pillar1.setAttribute('material', 'src: #brick-texture; color: #7d4d3d; roughness: 1.0');
        wallGroup.appendChild(pillar1);

        const pillar2 = document.createElement('a-box');
        pillar2.setAttribute('position', `${startX + width/2 + 1.2} ${height/2 + 0.2} ${startZ}`);
        pillar2.setAttribute('width', 0.5);
        pillar2.setAttribute('height', height + 0.4);
        pillar2.setAttribute('depth', 0.5);
        pillar2.setAttribute('material', 'src: #brick-texture; color: #7d4d3d; roughness: 1.0');
        wallGroup.appendChild(pillar2);

        parentEl.appendChild(wallGroup);
    }


    buildEliteCourtyardHouse(x, z, size, drainDirection = 'east', parentEl = this.container) {
        // Double-story house structure with open central courtyard, private well, bathing area, and staircase
        const houseGroup = document.createElement('a-entity');
        houseGroup.setAttribute('position', `${x + size/2} 0 ${z + size/2}`); // Center
        
        const wallThickness = 0.5;
        const height = 5.2; // 2 stories
        
        // 1. Outer Walls (exposed brick or mud plaster)
        // Front Wall (North)
        const frontWall = document.createElement('a-box');
        frontWall.setAttribute('position', `0 ${height/2} ${-size/2}`);
        frontWall.setAttribute('width', size);
        frontWall.setAttribute('height', height);
        frontWall.setAttribute('depth', wallThickness);
        frontWall.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size} ${height}`);
        houseGroup.appendChild(frontWall);
        
        // Back Wall (South)
        const backWall = document.createElement('a-box');
        backWall.setAttribute('position', `0 ${height/2} ${size/2}`);
        backWall.setAttribute('width', size);
        backWall.setAttribute('height', height);
        backWall.setAttribute('depth', wallThickness);
        backWall.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size} ${height}`);
        houseGroup.appendChild(backWall);
        
        // Left Wall (West)
        const leftWall = document.createElement('a-box');
        leftWall.setAttribute('position', `${-size/2} ${height/2} 0`);
        leftWall.setAttribute('width', wallThickness);
        leftWall.setAttribute('height', height);
        leftWall.setAttribute('depth', size);
        leftWall.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size} ${height}`);
        houseGroup.appendChild(leftWall);
        
        // Right Wall (East) - Includes entry door on ground floor
        const rightWallLower1 = document.createElement('a-box');
        rightWallLower1.setAttribute('position', `${size/2} ${2.4/2} ${-size/4}`);
        rightWallLower1.setAttribute('width', wallThickness);
        rightWallLower1.setAttribute('height', 2.4);
        rightWallLower1.setAttribute('depth', size/2 - 0.6);
        rightWallLower1.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size/2} 2`);
        houseGroup.appendChild(rightWallLower1);
        
        const rightWallLower2 = document.createElement('a-box');
        rightWallLower2.setAttribute('position', `${size/2} ${2.4/2} ${size/4 + 0.6}`);
        rightWallLower2.setAttribute('width', wallThickness);
        rightWallLower2.setAttribute('height', 2.4);
        rightWallLower2.setAttribute('depth', size/2 - 0.6);
        rightWallLower2.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size/2} 2`);
        houseGroup.appendChild(rightWallLower2);
        
        // Upper part of Right Wall (No windows facing outside street to maintain privacy)
        const rightWallUpper = document.createElement('a-box');
        rightWallUpper.setAttribute('position', `${size/2} ${3.8} 0`);
        rightWallUpper.setAttribute('width', wallThickness);
        rightWallUpper.setAttribute('height', 2.8);
        rightWallUpper.setAttribute('depth', size);
        rightWallUpper.setAttribute('material', `src: #brick-texture; color: #dfcfbf; repeat: ${size} 3`);
        houseGroup.appendChild(rightWallUpper);

        // 2. Central Open Courtyard
        const courtyardSize = size * 0.5;
        const courtyardFloor = document.createElement('a-plane');
        courtyardFloor.setAttribute('position', '0 0.02 0');
        courtyardFloor.setAttribute('rotation', '-90 0 0');
        courtyardFloor.setAttribute('width', courtyardSize);
        courtyardFloor.setAttribute('height', courtyardSize);
        courtyardFloor.setAttribute('material', 'src: #earth-texture; repeat: 2 2');
        houseGroup.appendChild(courtyardFloor);

        // 3. Private Well Structure (inside the house vestibule)
        const well = document.createElement('a-cylinder');
        well.setAttribute('position', `${-size/3.5} 0.6 ${-size/3.5}`);
        well.setAttribute('radius', 0.5);
        well.setAttribute('height', 1.2);
        well.setAttribute('material', 'src: #brick-texture; repeat: 4 2; roughness: 1.0');
        
        const wellWater = document.createElement('a-cylinder');
        wellWater.setAttribute('position', `${-size/3.5} 0.2 ${-size/3.5}`);
        wellWater.setAttribute('radius', 0.45);
        wellWater.setAttribute('height', 0.2);
        wellWater.setAttribute('color', '#3a6c9a');
        wellWater.setAttribute('material', 'roughness: 0.3');
        
        houseGroup.appendChild(well);
        houseGroup.appendChild(wellWater);

        // 4. Bathing Platform (highly characteristic bathroom floor made of tightly fitted bricks)
        const bathPlatform = document.createElement('a-box');
        bathPlatform.setAttribute('position', `${size/3.5} 0.05 ${size/3.5}`);
        bathPlatform.setAttribute('width', 2);
        bathPlatform.setAttribute('height', 0.1);
        bathPlatform.setAttribute('depth', 1.5);
        bathPlatform.setAttribute('material', 'src: #brick-texture; repeat: 4 3; color: #8a7a6e; roughness: 0.9');
        houseGroup.appendChild(bathPlatform);
        
        // Bathroom Wall dividers
        const bathWall = document.createElement('a-box');
        bathWall.setAttribute('position', `${size/3.5 - 1.0} 0.8 ${size/3.5}`);
        bathWall.setAttribute('width', 0.15);
        bathWall.setAttribute('height', 1.5);
        bathWall.setAttribute('depth', 1.5);
        bathWall.setAttribute('material', 'src: #brick-texture; repeat: 3 3');
        houseGroup.appendChild(bathWall);

        // 5. Drainage Outlet Chute — exits toward the lane drain (direction-aware)
        const drainChute = document.createElement('a-box');
        const chuteX = (drainDirection === 'west') ? (-size/2 - 0.25) : (size/2 + 0.25);
        const chuteRot = (drainDirection === 'west') ? '0 0 15' : '0 0 -15';
        drainChute.setAttribute('position', `${chuteX} 0.05 ${size/3.5}`);
        drainChute.setAttribute('width', 0.95);
        drainChute.setAttribute('height', 0.2);
        drainChute.setAttribute('depth', 0.4);
        drainChute.setAttribute('rotation', chuteRot);
        drainChute.setAttribute('material', 'src: #brick-texture; repeat: 1 1; color: #5a4b40; roughness: 1.0');
        houseGroup.appendChild(drainChute);

        // 6. Staircase to Upper Roof (Procedural staircase of rising brick steps)
        const staircase = document.createElement('a-entity');
        staircase.setAttribute('position', `${-size/3.5} 0 ${size/3.5}`);
        
        const stepCount = 8;
        const stepWidth = 1.0;
        const stepDepth = 0.35;
        const totalRise = 2.6; // height of first story
        
        for (let i = 0; i < stepCount; i++) {
            const step = document.createElement('a-box');
            const stepHeight = (totalRise / stepCount) * (i + 1);
            step.setAttribute('position', `0 ${stepHeight/2} ${-i * stepDepth}`);
            step.setAttribute('width', stepWidth);
            step.setAttribute('height', stepHeight);
            step.setAttribute('depth', stepDepth);
            step.setAttribute('material', 'src: #brick-texture; repeat: 1 2');
            staircase.appendChild(step);
        }
        houseGroup.appendChild(staircase);

        // 7. Second Story Rooms (Built over the ground floor layout, leaving the center open)
        const firstFloorCeiling = document.createElement('a-box');
        firstFloorCeiling.setAttribute('position', `0 2.6 0`);
        firstFloorCeiling.setAttribute('width', size);
        firstFloorCeiling.setAttribute('height', 0.15);
        firstFloorCeiling.setAttribute('depth', size);
        firstFloorCeiling.setAttribute('material', 'src: #wood-texture; repeat: 6 6');
        houseGroup.appendChild(firstFloorCeiling);

        // Cut open the courtyard on the second floor ceiling (A-Frame needs composite, we simulate by putting flat roof slabs around)
        // Instead of a single box, we put 4 wood panels to frame the courtyard
        firstFloorCeiling.setAttribute('visible', 'false'); // Hide the solid slab
        
        const roofBorderWidth = (size - courtyardSize) / 2;
        
        // North border
        const nRoof = document.createElement('a-box');
        nRoof.setAttribute('position', `0 2.6 ${-size/2 + roofBorderWidth/2}`);
        nRoof.setAttribute('width', size);
        nRoof.setAttribute('height', 0.15);
        nRoof.setAttribute('depth', roofBorderWidth);
        nRoof.setAttribute('material', 'src: #wood-texture; repeat: 5 1');
        houseGroup.appendChild(nRoof);

        // South border
        const sRoof = document.createElement('a-box');
        sRoof.setAttribute('position', `0 2.6 ${size/2 - roofBorderWidth/2}`);
        sRoof.setAttribute('width', size);
        sRoof.setAttribute('height', 0.15);
        sRoof.setAttribute('depth', roofBorderWidth);
        sRoof.setAttribute('material', 'src: #wood-texture; repeat: 5 1');
        houseGroup.appendChild(sRoof);

        // West border
        const wRoof = document.createElement('a-box');
        wRoof.setAttribute('position', `${-size/2 + roofBorderWidth/2} 2.6 0`);
        wRoof.setAttribute('width', roofBorderWidth);
        wRoof.setAttribute('height', 0.15);
        wRoof.setAttribute('depth', courtyardSize);
        wRoof.setAttribute('material', 'src: #wood-texture; repeat: 1 3');
        houseGroup.appendChild(wRoof);

        // East border
        const eRoof = document.createElement('a-box');
        eRoof.setAttribute('position', `${size/2 - roofBorderWidth/2} 2.6 0`);
        eRoof.setAttribute('width', roofBorderWidth);
        eRoof.setAttribute('height', 0.15);
        eRoof.setAttribute('depth', courtyardSize);
        eRoof.setAttribute('material', 'src: #wood-texture; repeat: 1 3');
        houseGroup.appendChild(eRoof);

        // Flat Roof for Second Story (covering the boundaries)
        const secondFloorCeiling = document.createElement('a-box');
        secondFloorCeiling.setAttribute('position', `0 ${height} 0`);
        secondFloorCeiling.setAttribute('width', size);
        secondFloorCeiling.setAttribute('height', 0.15);
        secondFloorCeiling.setAttribute('depth', size);
        secondFloorCeiling.setAttribute('material', 'src: #wood-texture; color: #6a4a3a; repeat: 6 6');
        houseGroup.appendChild(secondFloorCeiling);

        parentEl.appendChild(houseGroup);
    }

    buildWorkerHouse(x, z, size, drainDirection = 'east', parentEl = this.container) {
        // Smaller double-roomed worker/craftsmen row house
        const houseGroup = document.createElement('a-entity');
        houseGroup.setAttribute('position', `${x + size/2} 0 ${z + size/2}`);
        
        const wallThickness = 0.4;
        const height = 3.0; // 1 story
        
        // Exposed red mud brick walls
        const wallMaterial = 'src: #brick-texture; color: #b87352; repeat: 6 3; roughness: 1.0';

        // Outer walls
        // Front (North)
        const frontWall = document.createElement('a-box');
        frontWall.setAttribute('position', `0 ${height/2} ${-size/2}`);
        frontWall.setAttribute('width', size);
        frontWall.setAttribute('height', height);
        frontWall.setAttribute('depth', wallThickness);
        frontWall.setAttribute('material', wallMaterial);
        houseGroup.appendChild(frontWall);

        // Back (South)
        const backWall = document.createElement('a-box');
        backWall.setAttribute('position', `0 ${height/2} ${size/2}`);
        backWall.setAttribute('width', size);
        backWall.setAttribute('height', height);
        backWall.setAttribute('depth', wallThickness);
        backWall.setAttribute('material', wallMaterial);
        houseGroup.appendChild(backWall);

        // Left (West)
        const leftWall = document.createElement('a-box');
        leftWall.setAttribute('position', `${-size/2} ${height/2} 0`);
        leftWall.setAttribute('width', wallThickness);
        leftWall.setAttribute('height', height);
        leftWall.setAttribute('depth', size);
        leftWall.setAttribute('material', wallMaterial);
        houseGroup.appendChild(leftWall);

        // Right (East) - With door entrance
        const rightWall1 = document.createElement('a-box');
        rightWall1.setAttribute('position', `${size/2} ${height/2} ${-size/4}`);
        rightWall1.setAttribute('width', wallThickness);
        rightWall1.setAttribute('height', height);
        rightWall1.setAttribute('depth', size/2 - 0.5);
        rightWall1.setAttribute('material', wallMaterial);
        houseGroup.appendChild(rightWall1);

        const rightWall2 = document.createElement('a-box');
        rightWall2.setAttribute('position', `${size/2} ${height/2} ${size/4 + 0.5}`);
        rightWall2.setAttribute('width', wallThickness);
        rightWall2.setAttribute('height', height);
        rightWall2.setAttribute('depth', size/2 - 0.5);
        rightWall2.setAttribute('material', wallMaterial);
        houseGroup.appendChild(rightWall2);

        // Internal dividing wall creating exactly two rooms (workers quarters hierarchy)
        const dividerWall = document.createElement('a-box');
        dividerWall.setAttribute('position', `0 ${height/2} 0`);
        dividerWall.setAttribute('width', size - 0.8);
        dividerWall.setAttribute('height', height);
        dividerWall.setAttribute('depth', wallThickness);
        dividerWall.setAttribute('material', wallMaterial);
        houseGroup.appendChild(dividerWall);

        // Flat wooden/reconstructed reed roof
        const roof = document.createElement('a-box');
        roof.setAttribute('position', `0 ${height + 0.05} 0`);
        roof.setAttribute('width', size + 0.1);
        roof.setAttribute('height', 0.15);
        roof.setAttribute('depth', size + 0.1);
        roof.setAttribute('material', 'src: #wood-texture; repeat: 3 3; roughness: 0.9; color: #a0522d');
        houseGroup.appendChild(roof);

        // Drainage outlet hole — direction-aware, exits into the adjacent lane drain
        const drainOut = document.createElement('a-box');
        const outX = (drainDirection === 'west') ? (-size/2 - 0.2) : (size/2 + 0.2);
        drainOut.setAttribute('position', `${outX} 0.05 ${size/3}`);
        drainOut.setAttribute('width', 0.6);
        drainOut.setAttribute('height', 0.15);
        drainOut.setAttribute('depth', 0.3);
        drainOut.setAttribute('material', 'src: #brick-texture; color: #3d3128; repeat: 1 1; roughness: 1.0');
        houseGroup.appendChild(drainOut);

        parentEl.appendChild(houseGroup);
    }

    // ==========================================
    // DRAINAGE NETWORK BUILDERS
    // ==========================================

    /**
     * Builds open brick-lined lane gutters running along the West and East
     * internal lanes inside a residential block. Wastewater flows out via
     * weepholes in the South boundary wall into the main street sewers.
     */
    buildBlockLaneDrains(startX, startZ, width, depth, parentEl = this.container) {
        this.buildSingleLaneDrain(startX + 0.5,         startZ, depth, parentEl); // West lane
        this.buildSingleLaneDrain(startX + width - 0.5, startZ, depth, parentEl); // East lane
    }

    buildSingleLaneDrain(x, startZ, depth, parentEl) {
        const drainGroup = document.createElement('a-entity');
        drainGroup.setAttribute('position', `${x} 0.02 ${startZ + depth / 2}`);

        // Dark muddy sewage water bed — wide & clearly visible from above
        const waterBed = document.createElement('a-plane');
        waterBed.setAttribute('position', '0 0.02 0');
        waterBed.setAttribute('rotation', '-90 0 0');
        waterBed.setAttribute('width', 0.8);
        waterBed.setAttribute('height', depth);
        waterBed.setAttribute('material', 'color: #1e1510; roughness: 0.05; metalness: 0.3; transparent: true; opacity: 0.96');
        drainGroup.appendChild(waterBed);

        // Left brick lining — tall enough to see from ground level
        const leftLining = document.createElement('a-box');
        leftLining.setAttribute('position', '-0.45 0.2 0');
        leftLining.setAttribute('width', 0.14);
        leftLining.setAttribute('height', 0.4);
        leftLining.setAttribute('depth', depth);
        leftLining.setAttribute('material', 'src: #brick-texture; color: #7a4d33; repeat: 1 10; roughness: 1.0');
        drainGroup.appendChild(leftLining);

        // Right brick lining
        const rightLining = document.createElement('a-box');
        rightLining.setAttribute('position', '0.45 0.2 0');
        rightLining.setAttribute('width', 0.14);
        rightLining.setAttribute('height', 0.4);
        rightLining.setAttribute('depth', depth);
        rightLining.setAttribute('material', 'src: #brick-texture; color: #7a4d33; repeat: 1 10; roughness: 1.0');
        drainGroup.appendChild(rightLining);

        // Stone cover slabs over the channel with regular open gaps (every 3rd slab is open)
        const slabLen = 1.5;
        const slabCount = Math.floor(depth / slabLen);
        for (let i = 0; i < slabCount; i++) {
            if (i % 3 === 0) continue; // open gap so water is visible
            const slab = document.createElement('a-box');
            const zOff = -depth / 2 + i * slabLen + slabLen / 2;
            slab.setAttribute('position', `0 0.38 ${zOff}`);
            slab.setAttribute('width', 0.82);
            slab.setAttribute('height', 0.09);
            slab.setAttribute('depth', slabLen - 0.08);
            const c = (i % 2 === 0) ? '#8a7a6e' : '#6e5d52';
            slab.setAttribute('material', `src: #brick-texture; color: ${c}; repeat: 1 1; roughness: 1.0`);
            drainGroup.appendChild(slab);
        }

        parentEl.appendChild(drainGroup);
    }

    /**
     * Builds a single covered sewer line (N-S or E-W).
     * isNS=true builds a North-South line at X=x spanning Z from zStart to zEnd.
     * isNS=false builds an East-West line at Z=z spanning X from xStart to xEnd.
     */
    buildSewerLine(x, z, start, end) {
        const isNS = (z === null);
        const length = Math.abs(end - start);
        const center = (start + end) / 2;

        const sewerGroup = document.createElement('a-entity');
        if (isNS) {
            sewerGroup.setAttribute('position', `${x} 0.01 ${center}`);
        } else {
            sewerGroup.setAttribute('position', `${center} 0.01 ${z}`);
        }

        // Muddy waste water plane inside the trench
        const waterPlane = document.createElement('a-plane');
        waterPlane.setAttribute('rotation', '-90 0 0');
        waterPlane.setAttribute('position', '0 0.02 0');
        waterPlane.setAttribute('width',  isNS ? 1.0 : length);
        waterPlane.setAttribute('height', isNS ? length : 1.0);
        waterPlane.setAttribute('material', 'color: #1e1510; roughness: 0.05; metalness: 0.3; transparent: true; opacity: 0.96');
        sewerGroup.appendChild(waterPlane);

        // Brick side borders — taller for better visibility
        const borderThick = 0.15;
        const borderH     = 0.32;

        if (isNS) {
            [-0.45, 0.45].forEach(offset => {
                const border = document.createElement('a-box');
                border.setAttribute('position', `${offset} ${borderH/2} 0`);
                border.setAttribute('width', borderThick);
                border.setAttribute('height', borderH);
                border.setAttribute('depth', length);
                border.setAttribute('material', 'src: #brick-texture; color: #7d503f; repeat: 1 10; roughness: 1.0');
                sewerGroup.appendChild(border);
            });
        } else {
            [-0.45, 0.45].forEach(offset => {
                const border = document.createElement('a-box');
                border.setAttribute('position', `0 ${borderH/2} ${offset}`);
                border.setAttribute('width', length);
                border.setAttribute('height', borderH);
                border.setAttribute('depth', borderThick);
                border.setAttribute('material', 'src: #brick-texture; color: #7d503f; repeat: 10 1; roughness: 1.0');
                sewerGroup.appendChild(border);
            });
        }

        // Cover slabs with open gaps every 4th slab so sewage is visible
        const slabLen   = 1.2;
        const slabCount = Math.floor(length / slabLen);

        for (let i = 0; i < slabCount; i++) {
            if (i % 4 === 0) continue; // leave a gap

            const slab = document.createElement('a-box');
            const offset = -length / 2 + i * slabLen + slabLen / 2;
            if (isNS) {
                slab.setAttribute('position', `0 0.2 ${offset}`);
                slab.setAttribute('width',  0.85);
                slab.setAttribute('height', 0.08);
                slab.setAttribute('depth',  slabLen - 0.06);
            } else {
                slab.setAttribute('position', `${offset} 0.2 0`);
                slab.setAttribute('width',  slabLen - 0.06);
                slab.setAttribute('height', 0.08);
                slab.setAttribute('depth',  0.85);
            }
            const color = (i % 2 === 0) ? '#8a7a6e' : '#736458';
            slab.setAttribute('material', `src: #brick-texture; color: ${color}; repeat: 1 1; roughness: 1.0`);
            if (i % 7 === 1) {
                slab.setAttribute('class', 'clickable');
                slab.setAttribute('data-info', 'Covered Street Drain: Slabs could be lifted for inspection and clearing of silt. The Harappans maintained a city-wide underground sewage network — one of the world\'s first.');
            }
            sewerGroup.appendChild(slab);
        }

        this.container.appendChild(sewerGroup);
    }

    /**
     * Builds the full city-wide grid of covered main street sewers.
     * 6 N-S sewers line every major street, 6 E-W cross-sewers connect them at intersections.
     */
    buildCitySewerGrid() {
        console.log("🌊 Building City-wide Street Sewer Grid...");

        // ── North-South sewers (one per street corridor) ──
        const nsSewers = [
            { x: -40.5, zS: -25, zE: 95 },  // Far West outer lane
            { x: -24.0, zS: -25, zE: 95 },  // Between Column1 & Column2
            { x:  -8.5, zS: -25, zE: 95 },  // Main Avenue West kerb
            { x:   6.5, zS: -25, zE: 95 },  // Main Avenue East kerb
            { x:  22.0, zS: -25, zE: 95 },  // Between Elite Col1 & Col2
            { x:  38.5, zS: -25, zE: 95 }   // Far East outer lane
        ];

        // ── East-West sewers (at every block-gap row) ──
        const ewSewers = [
            { z: -21.5, xS: -40.5, xE: 38.5 },
            { z:   3.0, xS: -40.5, xE: 38.5 },
            { z:  23.0, xS: -40.5, xE: 38.5 },
            { z:  43.0, xS: -40.5, xE: 38.5 },
            { z:  63.0, xS: -40.5, xE: 38.5 },
            { z:  83.0, xS: -40.5, xE: 38.5 }
        ];

        nsSewers.forEach(s => this.buildSewerLine(s.x,  null, s.zS, s.zE));
        ewSewers.forEach(s => this.buildSewerLine(null, s.z,  s.xS, s.xE));
    }

    buildCustomSettlingBasins() {
        const pitPositions = [
            { x: 0, z: -25 },
            { x: 0, z: 10 },
            { x: 0, z: 50 }
        ];
        
        pitPositions.forEach(pos => {
            const basin = document.createElement('a-entity');
            basin.setAttribute('position', `${pos.x} 0.02 ${pos.z}`);
            
            const basinWalls = document.createElement('a-box');
            basinWalls.setAttribute('position', '0 0.1 0');
            basinWalls.setAttribute('width', 2.2);
            basinWalls.setAttribute('height', 0.35);
            basinWalls.setAttribute('depth', 2.2);
            basinWalls.setAttribute('material', 'src: #brick-texture; color: #4a3d33; repeat: 2 1; roughness: 1.0');
            basin.appendChild(basinWalls);
            
            const grate = document.createElement('a-box');
            grate.setAttribute('position', '0 0.29 0');
            grate.setAttribute('width', 1.8);
            grate.setAttribute('height', 0.05);
            grate.setAttribute('depth', 1.8);
            grate.setAttribute('material', 'color: #2b221a; roughness: 1.0');
            grate.setAttribute('class', 'clickable');
            grate.setAttribute('data-info', 'Settling Basin (Soak Pit): Located at street corners to collect sediment, preventing clogging of the town drains.');
            basin.appendChild(grate);
            
            const sludge = document.createElement('a-plane');
            sludge.setAttribute('position', '0 0.31 0');
            sludge.setAttribute('rotation', '-90 0 0');
            sludge.setAttribute('width', 1.4);
            sludge.setAttribute('height', 1.4);
            sludge.setAttribute('color', '#3c3024');
            sludge.setAttribute('material', 'roughness: 0.8');
            basin.appendChild(sludge);
            
            this.container.appendChild(basin);
        });
    }

    buildEliteEnclaveWalls(minX, maxX, minZ, maxZ) {
        const wallGroup = document.createElement('a-entity');
        wallGroup.setAttribute('id', 'elite-enclave-walls');
        
        const wallHeight = 4.5;
        const wallThickness = 0.8;
        const wallMat = 'src: #brick-texture; repeat: 12 3; roughness: 1.0';
        
        // West Wall (X = minX) - Gated entrance in the center (Z = 10 to 20)
        this.buildWallSection(wallGroup, minX, minZ, minX, 10, wallHeight, wallThickness, wallMat);
        this.buildWallSection(wallGroup, minX, 20, minX, maxZ, wallHeight, wallThickness, wallMat);
        this.buildGatePillars(wallGroup, minX, 10, 20, wallHeight);
        
        // East Wall (X = maxX) - Solid separator wall with a small guarded gap (Z = 12 to 15)
        this.buildWallSection(wallGroup, maxX, minZ, maxX, 12, wallHeight, wallThickness, wallMat);
        this.buildWallSection(wallGroup, maxX, 15, maxX, maxZ, wallHeight, wallThickness, wallMat);
        this.buildGatePillars(wallGroup, maxX, 12, 15, wallHeight);
        
        // North Wall (Z = minZ)
        this.buildWallSection(wallGroup, minX, minZ, maxX, minZ, wallHeight, wallThickness, wallMat);
        
        // South Wall (Z = maxZ)
        this.buildWallSection(wallGroup, minX, maxZ, maxX, maxZ, wallHeight, wallThickness, wallMat);
        
        // Add decorative, structural pillars every 10m along the perimeter
        this.buildWallPillars(wallGroup, minX, maxX, minZ, maxZ, wallHeight);
        
        this.container.appendChild(wallGroup);
    }

    buildWallSection(group, x1, z1, x2, z2, height, thickness, material) {
        const wall = document.createElement('a-box');
        const cx = (x1 + x2) / 2;
        const cz = (z1 + z2) / 2;
        
        let width, depth;
        if (x1 === x2) {
            width = thickness;
            depth = Math.abs(z2 - z1);
        } else {
            width = Math.abs(x2 - x1);
            depth = thickness;
        }
        
        wall.setAttribute('position', `${cx} ${height/2} ${cz}`);
        wall.setAttribute('width', width);
        wall.setAttribute('height', height);
        wall.setAttribute('depth', depth);
        wall.setAttribute('material', material);
        group.appendChild(wall);
    }

    buildGatePillars(group, x, zStart, zEnd, height) {
        const pillarRadius = 0.55;
        const pillarHeight = height + 0.5;
        const pillarMat = 'src: #brick-texture; color: #dcb394; repeat: 3 6; roughness: 0.9';
        
        // Left pillar
        const p1 = document.createElement('a-cylinder');
        p1.setAttribute('position', `${x} ${pillarHeight/2} ${zStart}`);
        p1.setAttribute('radius', pillarRadius);
        p1.setAttribute('height', pillarHeight);
        p1.setAttribute('material', pillarMat);
        group.appendChild(p1);
        
        // Right pillar
        const p2 = document.createElement('a-cylinder');
        p2.setAttribute('position', `${x} ${pillarHeight/2} ${zEnd}`);
        p2.setAttribute('radius', pillarRadius);
        p2.setAttribute('height', pillarHeight);
        p2.setAttribute('material', pillarMat);
        group.appendChild(p2);
        
        // Wood lintel spanning the top of the gateway
        const lintel = document.createElement('a-box');
        lintel.setAttribute('position', `${x} ${pillarHeight + 0.2} ${(zStart + zEnd)/2}`);
        lintel.setAttribute('width', 1.2);
        lintel.setAttribute('height', 0.4);
        lintel.setAttribute('depth', Math.abs(zEnd - zStart) + 1.2);
        lintel.setAttribute('material', 'src: #wood-texture; repeat: 4 1; color: #8b5a2b');
        group.appendChild(lintel);
    }

    buildWallPillars(group, minX, maxX, minZ, maxZ, height) {
        const pillarRadius = 0.45;
        const pillarHeight = height + 0.2;
        const pillarMat = 'src: #brick-texture; color: #dfcfbf; repeat: 2 5; roughness: 0.9';
        
        const addPillar = (x, z) => {
            const pillar = document.createElement('a-cylinder');
            pillar.setAttribute('position', `${x} ${pillarHeight/2} ${z}`);
            pillar.setAttribute('radius', pillarRadius);
            pillar.setAttribute('height', pillarHeight);
            pillar.setAttribute('material', pillarMat);
            group.appendChild(pillar);
        };
        
        // Add pillars along West and East walls (X = minX, X = maxX)
        for (let z = minZ; z <= maxZ; z += 10) {
            if (z >= 10 && z <= 20) continue; // skip West gate
            if (z >= 12 && z <= 15) continue; // skip East gate
            addPillar(minX, z);
            addPillar(maxX, z);
        }
        
        // Add pillars along North and South walls (Z = minZ, Z = maxZ)
        for (let x = minX + 10; x < maxX; x += 10) {
            addPillar(x, minZ);
            addPillar(x, maxZ);
        }
    }

    // ==========================================
    // VEGETATION & WELLS
    // ==========================================

    /** Builds a stylised Indus Valley tree. type: 'palm' | 'peepal' | 'fig' */
    buildTree(x, z, type = 'palm') {
        const group = document.createElement('a-entity');
        group.setAttribute('position', `${x} 0 ${z}`);

        if (type === 'palm') {
            const trunk = document.createElement('a-cylinder');
            trunk.setAttribute('position', '0 2.5 0');
            trunk.setAttribute('radius-bottom', '0.22');
            trunk.setAttribute('radius-top', '0.12');
            trunk.setAttribute('height', '5.0');
            trunk.setAttribute('material', 'color: #7a5230; roughness: 1.0');
            group.appendChild(trunk);
            [0, 51, 103, 154, 205, 257, 308].forEach(angle => {
                const frond = document.createElement('a-plane');
                const rad = angle * Math.PI / 180;
                frond.setAttribute('position', `${Math.cos(rad)*1.8} 5.3 ${Math.sin(rad)*1.8}`);
                frond.setAttribute('rotation', `${-35 + (angle % 30)} ${angle} 0`);
                frond.setAttribute('width', '2.4');
                frond.setAttribute('height', '0.55');
                frond.setAttribute('material', 'color: #2d7a2e; roughness: 0.9; side: double; transparent: true; opacity: 0.92');
                group.appendChild(frond);
            });
        } else if (type === 'peepal') {
            const trunk = document.createElement('a-cylinder');
            trunk.setAttribute('position', '0 1.8 0');
            trunk.setAttribute('radius-bottom', '0.35');
            trunk.setAttribute('radius-top', '0.25');
            trunk.setAttribute('height', '3.6');
            trunk.setAttribute('material', 'color: #5c3d1e; roughness: 1.0');
            group.appendChild(trunk);
            [[0,4.5,0,2.5],[-1.2,3.8,0.8,1.8],[1.2,3.8,-0.8,1.8],[0,5.8,0.4,1.6]].forEach(([cx,cy,cz,r]) => {
                const canopy = document.createElement('a-sphere');
                canopy.setAttribute('position', `${cx} ${cy} ${cz}`);
                canopy.setAttribute('radius', `${r}`);
                canopy.setAttribute('material', 'color: #1a5c1e; roughness: 0.85; transparent: true; opacity: 0.94');
                group.appendChild(canopy);
            });
        } else { // fig
            const trunk = document.createElement('a-cylinder');
            trunk.setAttribute('position', '0 2.0 0');
            trunk.setAttribute('radius-bottom', '0.28');
            trunk.setAttribute('radius-top', '0.18');
            trunk.setAttribute('height', '4.0');
            trunk.setAttribute('material', 'color: #6b4826; roughness: 1.0');
            group.appendChild(trunk);
            [[0,4.8,0,2.2],[-1.0,4.2,1.0,1.5],[1.0,4.2,-1.0,1.5]].forEach(([cx,cy,cz,r]) => {
                const canopy = document.createElement('a-sphere');
                canopy.setAttribute('position', `${cx} ${cy} ${cz}`);
                canopy.setAttribute('radius', `${r}`);
                canopy.setAttribute('material', 'color: #2a6b22; roughness: 0.85; transparent: true; opacity: 0.93');
                group.appendChild(canopy);
            });
        }
        this.container.appendChild(group);
    }

    /** Builds a Harappan public well — brick ring, wooden crossbeam, rope and bucket. */
    buildPublicWell(x, z) {
        const group = document.createElement('a-entity');
        group.setAttribute('position', `${x} 0 ${z}`);

        // Brick ring surround
        const ring = document.createElement('a-torus');
        ring.setAttribute('position', '0 0.45 0');
        ring.setAttribute('radius', '0.7');
        ring.setAttribute('radius-tubular', '0.22');
        ring.setAttribute('segments-radial', '16');
        ring.setAttribute('segments-tubular', '12');
        ring.setAttribute('material', 'src: #brick-texture; color: #a06040; repeat: 6 2; roughness: 1.0');
        ring.setAttribute('class', 'clickable');
        ring.setAttribute('data-info', 'Public Well: Shared wells served the wider street quarter. Brick-lined shafts prevented collapse \u2014 some at Mohenjo-Daro survive to 15m deep.');
        group.appendChild(ring);

        // Dark water surface
        const water = document.createElement('a-cylinder');
        water.setAttribute('position', '0 0.12 0');
        water.setAttribute('radius', '0.48');
        water.setAttribute('height', '0.05');
        water.setAttribute('material', 'color: #0d3050; roughness: 0.05; metalness: 0.4; transparent: true; opacity: 0.9');
        group.appendChild(water);

        // Wooden crossbeam
        const beam = document.createElement('a-box');
        beam.setAttribute('position', '0 1.6 0');
        beam.setAttribute('width', '1.7');
        beam.setAttribute('height', '0.14');
        beam.setAttribute('depth', '0.14');
        beam.setAttribute('material', 'src: #wood-texture; color: #7a4a1e; repeat: 3 1');
        group.appendChild(beam);

        // Left post
        const post1 = document.createElement('a-cylinder');
        post1.setAttribute('position', '-0.75 0.9 0');
        post1.setAttribute('radius', '0.07');
        post1.setAttribute('height', '1.8');
        post1.setAttribute('material', 'color: #6b3d18; roughness: 1.0');
        group.appendChild(post1);

        // Right post
        const post2 = document.createElement('a-cylinder');
        post2.setAttribute('position', '0.75 0.9 0');
        post2.setAttribute('radius', '0.07');
        post2.setAttribute('height', '1.8');
        post2.setAttribute('material', 'color: #6b3d18; roughness: 1.0');
        group.appendChild(post2);

        // Rope
        const rope = document.createElement('a-cylinder');
        rope.setAttribute('position', '0.05 1.0 0');
        rope.setAttribute('radius', '0.025');
        rope.setAttribute('height', '1.0');
        rope.setAttribute('material', 'color: #c8a050; roughness: 1.0');
        group.appendChild(rope);

        // Bucket
        const bucket = document.createElement('a-box');
        bucket.setAttribute('position', '0.05 0.4 0');
        bucket.setAttribute('width', '0.22');
        bucket.setAttribute('height', '0.22');
        bucket.setAttribute('depth', '0.22');
        bucket.setAttribute('material', 'color: #8b5a2b; roughness: 1.0');
        group.appendChild(bucket);

        this.container.appendChild(group);
    }

    /** Builds a circular patch of green grass at (x, z). */
    buildGrassPatch(x, z, radius = 2.5) {
        const patch = document.createElement('a-cylinder');
        patch.setAttribute('position', `${x} 0.01 ${z}`);
        patch.setAttribute('radius', `${radius}`);
        patch.setAttribute('height', '0.04');
        patch.setAttribute('material', 'color: #3d7a2e; roughness: 0.95');
        this.container.appendChild(patch);

        const tuftCount = Math.floor(radius * 3);
        for (let i = 0; i < tuftCount; i++) {
            const angle = (i / tuftCount) * Math.PI * 2 + i * 0.7;
            const dist  = radius * (0.3 + (i % 3) * 0.22);
            const tuft = document.createElement('a-cylinder');
            tuft.setAttribute('position', `${x + Math.cos(angle)*dist} 0.03 ${z + Math.sin(angle)*dist}`);
            tuft.setAttribute('radius', `${0.18 + (i % 3) * 0.08}`);
            tuft.setAttribute('height', '0.06');
            tuft.setAttribute('material', `color: ${(i % 2 === 0) ? '#2d6622' : '#4a8c35'}; roughness: 1.0`);
            this.container.appendChild(tuft);
        }
    }

    /**
     * Scatters trees, public wells and green grass patches across
     * empty street corners, block courtyards and city periphery.
     */
    buildCityVegetation() {
        console.log('🌿 Planting City Vegetation & Wells...');

        // ── STREET-CORNER TREES ──
        const streetTrees = [
            // Workers district — avenue between Column 1 & Column 2
            { x: -30, z: -1,  type: 'palm'   },
            { x: -30, z: 21,  type: 'peepal' },
            { x: -30, z: 41,  type: 'palm'   },
            { x: -30, z: 61,  type: 'fig'    },
            { x: -30, z: 81,  type: 'peepal' },
            // West outer fringe
            { x: -45, z: 10,  type: 'palm'   },
            { x: -45, z: 30,  type: 'peepal' },
            { x: -45, z: 50,  type: 'fig'    },
            { x: -45, z: 70,  type: 'palm'   },
            // Grand central avenue (between Workers & Elite districts)
            { x: -4,  z: -10, type: 'peepal' },
            { x: -4,  z: 15,  type: 'palm'   },
            { x: -4,  z: 35,  type: 'fig'    },
            { x: -4,  z: 55,  type: 'peepal' },
            { x: -4,  z: 75,  type: 'palm'   },
            { x:  3,  z: -10, type: 'fig'    },
            { x:  3,  z: 15,  type: 'palm'   },
            { x:  3,  z: 35,  type: 'peepal' },
            { x:  3,  z: 55,  type: 'fig'    },
            { x:  3,  z: 75,  type: 'peepal' },
            // Elite enclave cross-streets
            { x: 20,  z: -5,  type: 'peepal' },
            { x: 20,  z: 18,  type: 'palm'   },
            { x: 20,  z: 38,  type: 'fig'    },
            { x: 20,  z: 58,  type: 'peepal' },
            { x: 20,  z: 78,  type: 'palm'   },
            // Far East fringe
            { x: 46,  z: 10,  type: 'palm'   },
            { x: 46,  z: 30,  type: 'fig'    },
            { x: 46,  z: 50,  type: 'peepal' },
            { x: 46,  z: 70,  type: 'palm'   },
            // Citadel northern approach
            { x: -15, z: -28, type: 'peepal' },
            { x:   5, z: -28, type: 'palm'   },
            { x:  18, z: -28, type: 'fig'    },
        ];
        streetTrees.forEach(t => this.buildTree(t.x, t.z, t.type));

        // ── PUBLIC WELLS ──
        const wellPositions = [
            // Workers district street corners
            { x: -30, z: 9  }, { x: -30, z: 29 }, { x: -30, z: 49 }, { x: -30, z: 69 },
            // Grand central avenue
            { x: -0.5, z: 5  }, { x: -0.5, z: 45 }, { x: -0.5, z: 85 },
            // Elite enclave
            { x: 20, z: 8  }, { x: 20, z: 28 }, { x: 20, z: 48 }, { x: 20, z: 68 },
            // Far east
            { x: 44, z: 20 }, { x: 44, z: 60 },
        ];
        wellPositions.forEach(w => this.buildPublicWell(w.x, w.z));

        // ── GRASS PATCHES ──
        const grassPatches = [
            // Around wells — Workers district
            { x: -30, z: 9,  r: 2.2 }, { x: -30, z: 29, r: 2.2 },
            { x: -30, z: 49, r: 2.2 }, { x: -30, z: 69, r: 2.2 },
            // Grand avenue green strips
            { x: -0.5, z: 5,  r: 2.5 }, { x: -0.5, z: 45, r: 2.5 }, { x: -0.5, z: 85, r: 2.5 },
            // Street-tree base pads
            { x: -30, z: -1, r: 1.5 }, { x: -30, z: 21, r: 1.5 }, { x: -30, z: 41, r: 1.5 },
            { x: -30, z: 61, r: 1.5 }, { x: -30, z: 81, r: 1.5 },
            { x: -4,  z: 15, r: 1.6 }, { x: -4,  z: 35, r: 1.6 }, { x: -4,  z: 55, r: 1.6 },
            { x:  3,  z: 35, r: 1.6 }, { x:  3,  z: 75, r: 1.6 },
            // City south periphery
            { x: -42, z: 90, r: 3.5 }, { x: -20, z: 92, r: 3.0 }, { x:   5, z: 92, r: 3.5 },
            { x:  25, z: 92, r: 3.0 }, { x:  44, z: 92, r: 3.5 },
            // City west fringe
            { x: -48, z: 20, r: 3.5 }, { x: -48, z: 50, r: 3.5 }, { x: -48, z: 80, r: 3.5 },
            // Elite enclave internal plazas
            { x: 20, z: 8,  r: 2.0 }, { x: 20, z: 28, r: 2.0 },
            { x: 20, z: 48, r: 2.0 }, { x: 20, z: 68, r: 2.0 },
            // Citadel approach
            { x: -15, z: -28, r: 1.8 }, { x: 5, z: -28, r: 1.8 }, { x: 18, z: -28, r: 1.8 },
        ];
        grassPatches.forEach(g => this.buildGrassPatch(g.x, g.z, g.r));
    }
}


document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const builder = new CityBuilder();
        builder.generate();
    }, 500);
});
