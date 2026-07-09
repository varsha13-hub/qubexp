const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourcePath = path.resolve(__dirname, '../assets/heart-source.glb');
const tempPath = path.resolve(__dirname, '../assets/heart-optimized.glb');
const targetPaths = [
  path.resolve(__dirname, '../human-anatomy/models/heart.glb'),
  path.resolve(__dirname, '../heart-vr/models/heart.glb')
];

// Ensure assets directory exists
if (!fs.existsSync(path.dirname(sourcePath))) {
  fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
}

// Check if source exists
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Source file not found at ${sourcePath}`);
  process.exit(1);
}

const initialSize = fs.statSync(sourcePath).size;
console.log(`📦 Initial model size: ${(initialSize / 1024 / 1024).toFixed(2)} MB (${initialSize} bytes)`);

// Run gltf-transform optimize command
try {
  console.log('⚡ Optimizing model with gltf-transform...');
  
  execSync(`npx gltf-transform optimize "${sourcePath}" "${tempPath}"`, { stdio: 'inherit' });
  
  if (!fs.existsSync(tempPath)) {
    throw new Error('Optimized file was not created by gltf-transform');
  }
  
  const optimizedSize = fs.statSync(tempPath).size;
  console.log(`✨ Optimized model size: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB (${optimizedSize} bytes)`);
  
  // Copy to destinations
  targetPaths.forEach(target => {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.copyFileSync(tempPath, target);
    console.log(`✅ Copied to ${target}`);
  });
  
  // Clean up temp file
  fs.unlinkSync(tempPath);
  console.log('🎉 Optimization and deployment completed successfully!');
} catch (error) {
  console.error('❌ Error optimizing models:', error);
  process.exit(1);
}
