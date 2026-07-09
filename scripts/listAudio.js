const fs = require('fs');
const path = require('path');

// Configure expected languages and audio keys
const langs = ['en', 'hi', 'kn', 'ta', 'te', 'bn'];
const keys = [
  'overview',
  'conclusion',
  'sun',
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune'
];

// Track statistics
const stats = {
  total: langs.length * keys.length,
  found: 0,
  missing: 0,
  small: 0
};

console.log('🔍 Checking audio files...\n');

langs.forEach(lang => {
  console.log(`\n📂 Language: ${lang}`);
  keys.forEach(key => {
    const audioPath = path.join(__dirname, '..', 'solar-system', 'audio', lang, `${key}.mp3`);
    
    if (!fs.existsSync(audioPath)) {
      console.log(`  ❌ Missing: ${key}.mp3`);
      stats.missing++;
    } else {
      const fileStats = fs.statSync(audioPath);
      const sizeKB = (fileStats.size / 1024).toFixed(1);
      
      if (fileStats.size < 20 * 1024) { // Less than 20KB
        console.log(`  ⚠️  Small file: ${key}.mp3 (${sizeKB} KB)`);
        stats.small++;
      } else {
        console.log(`  ✅ Found: ${key}.mp3 (${sizeKB} KB)`);
        stats.found++;
      }
    }
  });
});

console.log('\n📊 Summary:');
console.log(`Total expected files: ${stats.total}`);
console.log(`Found: ${stats.found}`);
console.log(`Missing: ${stats.missing}`);
console.log(`Small files (< 20KB): ${stats.small}`);

if (stats.missing > 0 || stats.small > 0) {
  console.log('\n⚠️  Action needed:');
  if (stats.missing > 0) {
    console.log('- Generate missing audio files');
  }
  if (stats.small > 0) {
    console.log('- Check small files for potential corruption');
  }
}