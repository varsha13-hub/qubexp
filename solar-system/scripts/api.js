// API Client for server communication
class APIClient {
    constructor() {
        this.baseURL = window.location.origin;
        this.timeout = 10000; // 10 seconds
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.timeout,
        };

        const config = { ...defaultOptions, ...options };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Health check
    async checkHealth() {
        return this.request('/api/health');
    }

    // Planets API
    async getPlanets() {
        return this.request('/api/planets');
    }

    async getPlanet(planetId) {
        return this.request(`/api/planets/${planetId}`);
    }

    async getPlanetFacts(planetId) {
        return this.request(`/api/planets/${planetId}/facts`);
    }

    async getPlanetStats(planetId) {
        return this.request(`/api/planets/${planetId}/stats`);
    }

    // Translation API
    async translate(text, sourceLang = 'en', targetLang = 'en') {
        return this.request('/api/translate', {
            method: 'POST',
            body: JSON.stringify({
                text,
                sourceLang,
                targetLang
            })
        });
    }

    async batchTranslate(texts, sourceLang = 'en', targetLang = 'en') {
        return this.request('/api/translate/batch', {
            method: 'POST',
            body: JSON.stringify({
                texts,
                sourceLang,
                targetLang
            })
        });
    }

    async getSupportedLanguages() {
        return this.request('/api/translate/languages');
    }

    async checkTranslationHealth() {
        return this.request('/api/translate/health');
    }

    // STT API
    async transcribeAudio(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        return this.request('/api/stt', {
            method: 'POST',
            headers: {}, // Let browser set Content-Type for FormData
            body: formData
        });
    }

    async checkSTTHealth() {
        return this.request('/api/stt/health');
    }

    async initializeSTT() {
        return this.request('/api/stt/init', {
            method: 'POST'
        });
    }

    // Utility methods
    isOnline() {
        return navigator.onLine;
    }

    async testConnection() {
        try {
            const health = await this.checkHealth();
            return {
                success: true,
                data: health
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Error handling
    handleError(error) {
        console.error('API Error:', error);
        
        if (error.message.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
        
        if (error.message.includes('Failed to fetch')) {
            return 'Network error. Please check your connection.';
        }
        
        if (error.message.includes('HTTP 404')) {
            return 'Resource not found.';
        }
        
        if (error.message.includes('HTTP 500')) {
            return 'Server error. Please try again later.';
        }
        
        return error.message || 'An unknown error occurred.';
    }
}

// Initialize API client
window.apiClient = new APIClient();
