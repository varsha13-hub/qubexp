#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// Model configurations
const models = [
    {
        name: 'vosk-model-small-en-us-0.15',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
        size: '42MB'
    },
    {
        name: 'vosk-model-small-hi-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-hi-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-kn-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-kn-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-ta-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-ta-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-te-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-te-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-mr-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-mr-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-bn-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-bn-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-es-0.42',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-es-0.42.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-fr-0.22',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip',
        size: '45MB'
    },
    {
        name: 'vosk-model-small-de-0.21',
        url: 'https://alphacephei.com/vosk/models/vosk-model-small-de-0.21.zip',
        size: '45MB'
    }
];

const modelsDir = path.join(__dirname, 'src', 'stt', 'models');

// Create models directory if it doesn't exist
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
    console.log('Created models directory:', modelsDir);
}

// Download function
function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            
            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloadedSize = 0;
            
            response.on('data', (chunk) => {
                downloadedSize += chunk.length;
                const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
                process.stdout.write(`\rDownloading... ${progress}%`);
            });
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                console.log('\nDownload completed!');
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(filepath, () => {}); // Delete the file async
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Extract function
function extractZip(zipPath, extractPath) {
    return new Promise((resolve, reject) => {
        try {
            // Use unzip command if available
            execSync(`unzip -o "${zipPath}" -d "${extractPath}"`, { stdio: 'inherit' });
            resolve();
        } catch (error) {
            // Try with 7zip if available
            try {
                execSync(`7z x "${zipPath}" -o"${extractPath}" -y`, { stdio: 'inherit' });
                resolve();
            } catch (error2) {
                reject(new Error('No unzip utility found. Please install unzip or 7zip.'));
            }
        }
    });
}

// Main download function
async function downloadModels() {
    console.log('🚀 Starting Vosk model download...\n');
    
    for (const model of models) {
        const modelPath = path.join(modelsDir, model.name);
        const zipPath = path.join(modelsDir, `${model.name}.zip`);
        
        // Check if model already exists
        if (fs.existsSync(modelPath)) {
            console.log(`✅ ${model.name} already exists, skipping...`);
            continue;
        }
        
        console.log(`📥 Downloading ${model.name} (${model.size})...`);
        
        try {
            // Download the model
            await downloadFile(model.url, zipPath);
            
            // Extract the model
            console.log(`📦 Extracting ${model.name}...`);
            await extractZip(zipPath, modelsDir);
            
            // Clean up zip file
            fs.unlinkSync(zipPath);
            
            console.log(`✅ ${model.name} downloaded and extracted successfully!\n`);
            
        } catch (error) {
            console.error(`❌ Failed to download ${model.name}:`, error.message);
            
            // Clean up partial download
            if (fs.existsSync(zipPath)) {
                fs.unlinkSync(zipPath);
            }
        }
    }
    
    console.log('🎉 Model download process completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy env.example to .env');
    console.log('2. Configure your translation API keys');
    console.log('3. Run: npm start');
}

// Run the download
downloadModels().catch(console.error);
