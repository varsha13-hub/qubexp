/**
 * Indus Valley Civilization API Routes
 * Provides historical data and content for the VR experience
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Cache for loaded data
let indusData = null;

/**
 * Load Indus Valley data from JSON file
 */
async function loadIndusData() {
    if (indusData) return indusData;
    
    try {
        const dataPath = path.join(__dirname, '../../../indus-valley/data/indus-valley.en.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        indusData = JSON.parse(rawData);
        console.log('✅ Indus Valley data loaded successfully');
        return indusData;
    } catch (error) {
        console.error('❌ Error loading Indus Valley data:', error);
        
        // Return fallback data with a delay to simulate loading
        return new Promise((resolve) => {
            setTimeout(() => {
                console.warn('⏳ Using fallback Indus Valley data after timeout');
                resolve({
                    civilization: {
                        name: { en: 'Indus Valley Civilization' },
                        period: { en: '2600-1900 BCE' },
                        description: { en: 'One of the world\'s earliest urban civilizations.' }
                    },
                    sites: {
                        'mohenjo-daro': {
                            id: 'mohenjo-daro',
                            name: { en: 'Mohenjo-daro' },
                            description: { en: 'The largest city of the Indus Valley Civilization.' },
                            features: { en: ['Great Bath', 'Citadel', 'Grid System'] }
                        }
                    }
                });
            }, 3000); // 3s wait
        });
    }
}

/**
 * Get all Indus Valley sites
 */
router.get('/', async (req, res) => {
    try {
        const data = await loadIndusData();
        res.json({
            success: true,
            civilization: data.civilization,
            sites: data.sites
        });
    } catch (error) {
        console.error('❌ Error fetching Indus Valley data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load Indus Valley data'
        });
    }
});

/**
 * Get specific site information
 */
router.get('/sites/:siteId', async (req, res) => {
    try {
        const { siteId } = req.params;
        const data = await loadIndusData();
        const site = data.sites[siteId];
        
        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        
        res.json({
            success: true,
            site: site
        });
    } catch (error) {
        console.error('❌ Error fetching site data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load site data'
        });
    }
});

/**
 * Get site features
 */
router.get('/sites/:siteId/features', async (req, res) => {
    try {
        const { siteId } = req.params;
        const data = await loadIndusData();
        const site = data.sites[siteId];
        
        if (!site) {
            return res.status(404).json({
                success: false,
                error: 'Site not found'
            });
        }
        
        res.json({
            success: true,
            features: site.features || {}
        });
    } catch (error) {
        console.error('❌ Error fetching site features:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load site features'
        });
    }
});

/**
 * Get artifacts
 */
router.get('/artifacts', async (req, res) => {
    try {
        const data = await loadIndusData();
        res.json({
            success: true,
            artifacts: data.artifacts || {}
        });
    } catch (error) {
        console.error('❌ Error fetching artifacts:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load artifacts'
        });
    }
});

/**
 * Get specific artifact
 */
router.get('/artifacts/:artifactId', async (req, res) => {
    try {
        const { artifactId } = req.params;
        const data = await loadIndusData();
        const artifact = data.artifacts[artifactId];
        
        if (!artifact) {
            return res.status(404).json({
                success: false,
                error: 'Artifact not found'
            });
        }
        
        res.json({
            success: true,
            artifact: artifact
        });
    } catch (error) {
        console.error('❌ Error fetching artifact:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load artifact'
        });
    }
});

/**
 * Get timeline
 */
router.get('/timeline', async (req, res) => {
    try {
        const data = await loadIndusData();
        res.json({
            success: true,
            timeline: data.timeline || {}
        });
    } catch (error) {
        console.error('❌ Error fetching timeline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load timeline'
        });
    }
});

/**
 * Get specific timeline period
 */
router.get('/timeline/:period', async (req, res) => {
    try {
        const { period } = req.params;
        const data = await loadIndusData();
        const timelineEntry = data.timeline[period];
        
        if (!timelineEntry) {
            return res.status(404).json({
                success: false,
                error: 'Timeline period not found'
            });
        }
        
        res.json({
            success: true,
            period: timelineEntry
        });
    } catch (error) {
        console.error('❌ Error fetching timeline period:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load timeline period'
        });
    }
});

/**
 * Search across all content
 */
router.get('/search', async (req, res) => {
    try {
        const { q: query, lang = 'en' } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                error: 'Search query required'
            });
        }
        
        const data = await loadIndusData();
        const results = [];
        
        // Search in sites
        Object.values(data.sites || {}).forEach(site => {
            const name = site.name[lang] || site.name.en || '';
            const description = site.description[lang] || site.description.en || '';
            
            if (name.toLowerCase().includes(query.toLowerCase()) || 
                description.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'site',
                    id: site.id,
                    name: name,
                    description: description
                });
            }
        });
        
        // Search in artifacts
        Object.values(data.artifacts || {}).forEach(artifact => {
            const name = artifact.name[lang] || artifact.name.en || '';
            const description = artifact.description[lang] || artifact.description.en || '';
            
            if (name.toLowerCase().includes(query.toLowerCase()) || 
                description.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'artifact',
                    name: name,
                    description: description
                });
            }
        });
        
        res.json({
            success: true,
            query: query,
            language: lang,
            results: results
        });
    } catch (error) {
        console.error('❌ Error searching Indus Valley content:', error);
        res.status(500).json({
            success: false,
            error: 'Search failed'
        });
    }
});

module.exports = router;
