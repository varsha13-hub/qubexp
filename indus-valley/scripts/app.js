/**
 * Indus Valley Open-World VR App Logic
 */

class AppUI {
    constructor() {
        this.ttsEnabled = true;
    }

    async init() {
        this.setupEventListeners();
        
        // Wait for A-Frame scene to load
        const scene = document.querySelector('a-scene');
        if (scene.hasLoaded) {
            this.startApp();
        } else {
            scene.addEventListener('loaded', () => this.startApp());
        }
    }

    async startApp() {
        // Load data first
        const dataLoaded = await window.dataLoader.init('en');
        if (!dataLoaded) {
            this.showNotification("Failed to load historical data.");
        }

        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => document.getElementById('loading-screen').style.display = 'none', 500);
            
            // Start open world logic
            window.worldManager.start();
        }, 1000);
    }

    setupEventListeners() {
        // Close Info Panel
        document.getElementById('btn-close-info').addEventListener('click', () => this.hideInfoPanel());

        // TTS Toggle
        const ttsBtn = document.getElementById('btn-toggle-tts');
        ttsBtn.addEventListener('click', () => {
            this.ttsEnabled = !this.ttsEnabled;
            ttsBtn.textContent = this.ttsEnabled ? '🔊 Audio On' : '🔇 Audio Off';
            if (!this.ttsEnabled && window.ttsManager) window.ttsManager.stop();
        });

        // Language Change
        document.getElementById('lang-select').addEventListener('change', (e) => {
            if (window.ttsManager) window.ttsManager.stop();
            window.dataLoader.setLanguage(e.target.value);
            
            // Re-narrate current POI if applicable
            if (window.worldManager.currentPOI) {
                window.worldManager.narratePOI(window.worldManager.currentPOI);
            }
        });
    }

    updateQuestTracker(found, total) {
        document.getElementById('quest-progress').textContent = `${found}/${total}`;
        
        // Update slots visual
        const slotsContainer = document.getElementById('quest-slots');
        slotsContainer.innerHTML = ''; // clear
        
        for (let i = 0; i < total; i++) {
            const slot = document.createElement('div');
            slot.className = 'artifact-slot' + (i < found ? ' found' : '');
            slot.textContent = i < found ? '✓' : '?';
            slotsContainer.appendChild(slot);
        }
    }

    showInfoPanel(title, description) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').textContent = title;
        document.getElementById('info-desc').textContent = description;
        
        panel.classList.add('visible');

        if (this.ttsEnabled && window.ttsManager) {
            window.ttsManager.speak(title + ". " + description, window.dataLoader.currentLang);
        }
    }

    hideInfoPanel() {
        document.getElementById('info-panel').classList.remove('visible');
        if (window.ttsManager) window.ttsManager.stop();
    }

    showNotification(msg) {
        const container = document.getElementById('notification-container');
        const notif = document.createElement('div');
        notif.className = 'notification';
        notif.textContent = msg;
        
        container.appendChild(notif);
        
        setTimeout(() => {
            notif.style.opacity = '0';
            setTimeout(() => notif.remove(), 300);
        }, 3000);
    }
}

// Global UI instance
window.appUI = new AppUI();

document.addEventListener('DOMContentLoaded', () => {
    window.appUI.init();
});
