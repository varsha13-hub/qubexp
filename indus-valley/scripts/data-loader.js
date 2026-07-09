/**
 * Data Loader for Indus Valley VR
 * Fetches and manages localized historical data.
 */

class DataLoader {
    constructor() {
        this.currentLang = 'en';
        this.data = null;
    }

    async init(lang = 'en') {
        this.currentLang = lang;
        try {
            // In a real app we'd fetch the specific language file, but the provided JSON 
            // has all languages bundled inside it (e.g. name.en, name.hi).
            const response = await fetch('data/indus-valley.en.json');
            if (!response.ok) throw new Error('Failed to load historical data');
            this.data = await response.json();
            console.log('✅ Historical data loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Error loading data:', error);
            return false;
        }
    }

    setLanguage(lang) {
        this.currentLang = lang;
        // Broadcast language change
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    }

    getSiteData(siteId) {
        if (!this.data || !this.data.sites[siteId]) return null;
        const site = this.data.sites[siteId];
        return {
            name: site.name[this.currentLang] || site.name['en'],
            description: site.description[this.currentLang] || site.description['en'],
            features: site.features[this.currentLang] || site.features['en'],
            significance: site.significance[this.currentLang] || site.significance['en']
        };
    }

    getCivInfo() {
        if (!this.data) return null;
        const civ = this.data.civilization;
        return {
            name: civ.name[this.currentLang] || civ.name['en'],
            period: civ.period[this.currentLang] || civ.period['en'],
            description: civ.description[this.currentLang] || civ.description['en']
        };
    }
}

window.dataLoader = new DataLoader();
