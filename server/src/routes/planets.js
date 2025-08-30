const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Load planet data
let planetData = null;

function loadPlanetData() {
  if (planetData) return planetData;
  
  try {
    const dataPath = path.join(__dirname, '../../../client/data/planets.en.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    planetData = JSON.parse(rawData);
    return planetData;
  } catch (error) {
    console.error('Error loading planet data:', error);
    // Return fallback data if file not found
    return {
      planets: [
        {
          id: 'sun',
          name: 'Sun',
          type: 'star',
          description: 'The Sun is the star at the center of our Solar System.',
          facts: [
            'The Sun contains 99.86% of the Solar System\'s mass',
            'Surface temperature is about 5,500°C (10,000°F)',
            'It takes light 8 minutes to travel from the Sun to Earth'
          ],
          stats: {
            diameter: '1,392,700 km',
            mass: '1.989 × 10^30 kg',
            distanceFromEarth: '149.6 million km'
          }
        },
        {
          id: 'mercury',
          name: 'Mercury',
          type: 'terrestrial',
          description: 'Mercury is the smallest and innermost planet in the Solar System.',
          facts: [
            'Mercury has no moons',
            'A day on Mercury lasts 59 Earth days',
            'Mercury has the most extreme temperature variations'
          ],
          stats: {
            diameter: '4,879 km',
            mass: '3.285 × 10^23 kg',
            distanceFromSun: '57.9 million km'
          }
        }
      ]
    };
  }
}

// Get all planets
router.get('/', (req, res) => {
  try {
    const data = loadPlanetData();
    res.json(data);
  } catch (error) {
    console.error('Error serving planets:', error);
    res.status(500).json({ error: 'Failed to load planet data' });
  }
});

// Get specific planet
router.get('/:planetId', (req, res) => {
  try {
    const data = loadPlanetData();
    const planet = data.planets.find(p => p.id === req.params.planetId);
    
    if (!planet) {
      return res.status(404).json({ error: 'Planet not found' });
    }
    
    res.json(planet);
  } catch (error) {
    console.error('Error serving planet:', error);
    res.status(500).json({ error: 'Failed to load planet data' });
  }
});

// Get planet facts
router.get('/:planetId/facts', (req, res) => {
  try {
    const data = loadPlanetData();
    const planet = data.planets.find(p => p.id === req.params.planetId);
    
    if (!planet) {
      return res.status(404).json({ error: 'Planet not found' });
    }
    
    res.json({
      planetId: planet.id,
      planetName: planet.name,
      facts: planet.facts || []
    });
  } catch (error) {
    console.error('Error serving planet facts:', error);
    res.status(500).json({ error: 'Failed to load planet facts' });
  }
});

// Get planet stats
router.get('/:planetId/stats', (req, res) => {
  try {
    const data = loadPlanetData();
    const planet = data.planets.find(p => p.id === req.params.planetId);
    
    if (!planet) {
      return res.status(404).json({ error: 'Planet not found' });
    }
    
    res.json({
      planetId: planet.id,
      planetName: planet.name,
      stats: planet.stats || {}
    });
  } catch (error) {
    console.error('Error serving planet stats:', error);
    res.status(500).json({ error: 'Failed to load planet stats' });
  }
});

module.exports = router;
