/**
 * Historically Accurate City Builder
 * Reconstructs the grid-based urban planning of Mohenjo-Daro's Lower Town.
 */

class CityBuilder {
    constructor() {
        this.container = null;
    }

    generate() {
        console.log("🏗️ Generating Historical City Grid...");
        this.container = document.getElementById('procedural-city-container');
        if (!this.container) return;

        // The Lower Town is entirely in the East (X > 10)
        // We will generate a grid from X = 15 to X = 95, and Z = -45 to Z = 75
        const minX = 15, maxX = 95;
        const minZ = -45, maxZ = 75;
        
        const mainStreetWidth = 10;
        const blockWidth = 20; // 20m wide residential blocks
        const blockDepth = 30; // 30m deep residential blocks
        
        for (let x = minX; x <= maxX; x += (blockWidth + mainStreetWidth)) {
            for (let z = minZ; z <= maxZ; z += (blockDepth + mainStreetWidth)) {
                
                // Skip the area where our custom hand-built residential model is (X=25, Z=0)
                if (x >= 15 && x <= 35 && z >= -15 && z <= 15) continue;
                
                // 1. Build the Residential Block
                this.buildResidentialBlock(x, z, blockWidth, blockDepth);
                
                // 2. Build the Street Drainage System alongside the block
                this.buildStreetDrains(x, z, blockWidth, blockDepth, mainStreetWidth);
            }
        }
    }

    buildResidentialBlock(startX, startZ, width, depth) {
        // A block consists of multiple courtyard houses separated by narrow 3m lanes
        const laneWidth = 3;
        const houseSize = 8; // 8x8m houses
        
        for (let hx = startX; hx < startX + width; hx += houseSize + laneWidth) {
            for (let hz = startZ; hz < startZ + depth; hz += houseSize + laneWidth) {
                // Ensure the house fits within the block
                if (hx + houseSize <= startX + width && hz + houseSize <= startZ + depth) {
                    this.buildCourtyardHouse(hx, hz, houseSize);
                }
            }
        }
    }

    buildCourtyardHouse(x, z, size) {
        const houseGroup = document.createElement('a-entity');
        houseGroup.setAttribute('position', `${x + size/2} 0 ${z + size/2}`); // Center the house
        
        const wallThickness = 0.5;
        const height = 3; // 1 story
        
        // Front Wall (North)
        const frontWall = document.createElement('a-box');
        frontWall.setAttribute('position', `0 ${height/2} ${-size/2}`);
        frontWall.setAttribute('width', size);
        frontWall.setAttribute('height', height);
        frontWall.setAttribute('depth', wallThickness);
        frontWall.setAttribute('material', `src: #brick-texture; repeat: ${size} ${height}`);
        houseGroup.appendChild(frontWall);
        
        // Back Wall (South)
        const backWall = document.createElement('a-box');
        backWall.setAttribute('position', `0 ${height/2} ${size/2}`);
        backWall.setAttribute('width', size);
        backWall.setAttribute('height', height);
        backWall.setAttribute('depth', wallThickness);
        backWall.setAttribute('material', `src: #brick-texture; repeat: ${size} ${height}`);
        houseGroup.appendChild(backWall);
        
        // Left Wall (West)
        const leftWall = document.createElement('a-box');
        leftWall.setAttribute('position', `${-size/2} ${height/2} 0`);
        leftWall.setAttribute('width', wallThickness);
        leftWall.setAttribute('height', height);
        leftWall.setAttribute('depth', size);
        leftWall.setAttribute('material', `src: #brick-texture; repeat: ${size} ${height}`);
        houseGroup.appendChild(leftWall);
        
        // Right Wall (East) - With a Door opening into the narrow lane
        const rightWall1 = document.createElement('a-box');
        rightWall1.setAttribute('position', `${size/2} ${height/2} ${-size/4}`);
        rightWall1.setAttribute('width', wallThickness);
        rightWall1.setAttribute('height', height);
        rightWall1.setAttribute('depth', size/2 - 0.5);
        rightWall1.setAttribute('material', `src: #brick-texture; repeat: ${size/2} ${height}`);
        houseGroup.appendChild(rightWall1);
        
        const rightWall2 = document.createElement('a-box');
        rightWall2.setAttribute('position', `${size/2} ${height/2} ${size/4 + 0.5}`);
        rightWall2.setAttribute('width', wallThickness);
        rightWall2.setAttribute('height', height);
        rightWall2.setAttribute('depth', size/2 - 0.5);
        rightWall2.setAttribute('material', `src: #brick-texture; repeat: ${size/2} ${height}`);
        houseGroup.appendChild(rightWall2);
        
        // Flat Roof (covering the edges, leaving the courtyard open)
        const roofWest = document.createElement('a-box');
        roofWest.setAttribute('position', `${-size/4} ${height + 0.1} 0`);
        roofWest.setAttribute('width', size/2);
        roofWest.setAttribute('height', 0.2);
        roofWest.setAttribute('depth', size);
        roofWest.setAttribute('material', `src: #wood-texture; repeat: 2 4`);
        houseGroup.appendChild(roofWest);
        
        const roofEast = document.createElement('a-box');
        roofEast.setAttribute('position', `${size/4} ${height + 0.1} ${size/4}`);
        roofEast.setAttribute('width', size/2);
        roofEast.setAttribute('height', 0.2);
        roofEast.setAttribute('depth', size/2);
        roofEast.setAttribute('material', `src: #wood-texture; repeat: 2 2`);
        houseGroup.appendChild(roofEast);

        // Ambient Prop in the Courtyard (Terracotta pot or well)
        if (Math.random() > 0.5) {
            const pot = document.createElement('a-cylinder');
            pot.setAttribute('position', `0 0.4 0`);
            pot.setAttribute('radius', '0.4');
            pot.setAttribute('height', '0.8');
            pot.setAttribute('material', 'color: #8b4513; roughness: 0.9'); // Terracotta
            houseGroup.appendChild(pot);
        }

        this.container.appendChild(houseGroup);
    }

    buildStreetDrains(x, z, blockWidth, blockDepth, mainStreetWidth) {
        // Build a covered brick drain running parallel to the block on the main street side
        const drain = document.createElement('a-box');
        // Place it just slightly outside the block, running along the Z axis
        drain.setAttribute('position', `${x - 2} 0.1 ${z + blockDepth/2}`);
        drain.setAttribute('width', 1);
        drain.setAttribute('height', 0.2);
        drain.setAttribute('depth', blockDepth);
        drain.setAttribute('material', `src: #brick-texture; repeat: 1 ${blockDepth}; roughness: 1.0`);
        
        this.container.appendChild(drain);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const builder = new CityBuilder();
        builder.generate();
    }, 500);
});
