const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const targetDir = path.join(rootDir, 'www');

// Source files and folders to copy
const itemsToCopy = [
  'index.html',
  'solar-system',
  'indus-valley',
  'human-anatomy',
  'heart-vr'
];

function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    // Exclude node_modules and .git folders
    const baseName = path.basename(src);
    if (baseName === 'node_modules' || baseName === '.git') {
      return;
    }
    
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function prepare() {
  console.log('🧹 Cleaning target www/ directory...');
  deleteFolderRecursive(targetDir);
  fs.mkdirSync(targetDir, { recursive: true });
  
  console.log('📦 Bundling frontend modules to www/...');
  for (const item of itemsToCopy) {
    const srcPath = path.join(rootDir, item);
    const destPath = path.join(targetDir, item);
    
    if (fs.existsSync(srcPath)) {
      console.log(`  -> Copying ${item}...`);
      copyRecursiveSync(srcPath, destPath);
    } else {
      console.warn(`  ⚠️ Warning: Source ${item} does not exist, skipping.`);
    }
  }
  
  console.log('✅ Capacitor bundle generation complete in www/ !');
}

prepare().catch((err) => {
  console.error('❌ Failed to prepare Capacitor build:', err);
  process.exit(1);
});
