const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  console.log('--- Inspecting realistic_human_heart.glb ---');
  const filePath = path.resolve(__dirname, '../heart-vr/models/realistic_human_heart.glb');
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  
  execSync(`npx gltf-transform inspect "${filePath}"`, { stdio: 'inherit' });
} catch (error) {
  console.error('Error inspecting model:', error);
}
