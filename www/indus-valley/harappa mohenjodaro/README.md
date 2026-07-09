# Indus Valley Civilization - WebXR Experience

A 3D immersive WebXR experience that recreates the ancient city of Mohenjo-Daro from the Indus Valley Civilization (2500 B.C.). This educational VR application allows students to explore the historically accurate town planning, architecture, and daily life of one of the world's earliest urban civilizations.

## Features

### 🏛️ Historical Accuracy
- **Grid-based street layout** based on archaeological findings
- **Baked brick houses** with flat rooftops and courtyards
- **Great Bath** with steps, water, and colonnades
- **Granaries** with raised platforms and ventilation
- **Drainage systems** with covered stone drains
- **Wells** and **market areas** for community life
- **City walls** and gates for fortification

### 🥽 WebXR & VR Support
- **First-person VR exploration** using WebXR API
- **Teleportation** and smooth walking navigation
- **VR controller support** for interaction
- **Cross-platform compatibility** (Oculus, HTC Vive, etc.)

### 🎯 Interactive Learning
- **Information hotspots** with historical facts
- **NPC characters** showing daily life activities
- **Animated activities** (pottery making, trading, water fetching)
- **Ambient audio** (market sounds, water, footsteps)

### 📹 Educational Tools
- **Guided tour mode** with automatic flythrough
- **Video recording** capability for presentations
- **Information panels** with detailed explanations
- **Hotspot system** for interactive learning

## Quick Start

### Prerequisites
- Modern web browser with WebXR support (Chrome, Firefox, Edge)
- VR headset (optional, for full VR experience)
- Local web server (for development)

### Installation

1. **Clone or download** this repository
2. **Install dependencies** (optional):
   ```bash
   npm install
   ```

3. **Start local server**:
   ```bash
   npm start
   # or
   npx http-server -p 8080
   ```

4. **Open in browser**:
   - Navigate to `http://localhost:8080`
   - For VR: Click "Enter VR" and put on your headset

### Alternative Setup
Simply open `index.html` in a modern browser (some features may be limited without a local server).

## Usage Guide

### Desktop/Web Browser
- **Mouse**: Click and drag to look around
- **Scroll**: Zoom in/out
- **Click hotspots**: Golden spheres for information
- **Buttons**: Use UI buttons for tours and VR mode

### VR Headset
- **Enter VR**: Click "Enter VR" button
- **Move**: Use VR controllers for teleportation
- **Interact**: Point and click on hotspots
- **Navigate**: Use controller buttons for movement

### Controls
- **Enter VR**: Start VR experience
- **Start Guided Tour**: Automatic flythrough of the city
- **Record Flythrough**: Capture video of the tour
- **Toggle Info**: Show/hide information panel

## Technical Details

### Technology Stack
- **Three.js**: 3D graphics and WebGL rendering
- **WebXR API**: VR/AR support and device integration
- **HTML5 Audio**: Spatial audio and ambient sounds
- **CSS3**: UI styling and responsive design

### Performance Optimization
- **LOD (Level of Detail)**: Objects simplify at distance
- **Frustum Culling**: Only render visible objects
- **Shadow Optimization**: Efficient shadow mapping
- **Asset Compression**: Optimized 3D models and textures

### Browser Compatibility
- **Chrome 79+**: Full WebXR support
- **Firefox 80+**: WebXR support
- **Edge 79+**: WebXR support
- **Safari**: Limited support (no WebXR)

## Educational Value

### Learning Objectives
- Understand urban planning in ancient civilizations
- Explore the architecture of the Indus Valley
- Learn about daily life in Mohenjo-Daro
- Experience historical reconstruction through VR

### Curriculum Integration
- **History**: Ancient civilizations and archaeology
- **Geography**: Urban planning and city development
- **Technology**: VR/AR in education
- **Social Studies**: Community life and trade

## Development

### Project Structure
```
indus-valley-webxr/
├── index.html              # Main HTML file
├── js/
│   └── indus-valley-scene.js  # Main 3D scene logic
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Customization
- **Modify city layout**: Edit `createCity()` method
- **Add new buildings**: Extend building creation functions
- **Customize NPCs**: Modify `createNPCs()` and `addNPCAccessories()`
- **Adjust audio**: Update `createAudio()` method

### Performance Tuning
- **Reduce polygon count**: Simplify 3D models
- **Optimize textures**: Use compressed formats
- **Adjust LOD distances**: Modify level-of-detail settings
- **Limit shadow quality**: Reduce shadow map resolution

## Troubleshooting

### Common Issues

**WebXR not working:**
- Ensure you're using HTTPS or localhost
- Check browser WebXR support
- Verify VR headset is connected

**Performance issues:**
- Close other browser tabs
- Reduce graphics quality in VR settings
- Use a more powerful computer

**Audio not playing:**
- Check browser audio permissions
- Ensure Web Audio API is supported
- Try refreshing the page

### Browser Requirements
- **WebGL 2.0** support required
- **WebXR** support for VR features
- **Web Audio API** for spatial audio
- **Modern JavaScript** (ES6+) support

## Contributing

This project is designed for educational use. Contributions are welcome for:
- Historical accuracy improvements
- Performance optimizations
- Additional educational content
- Bug fixes and enhancements

## License

MIT License - Feel free to use for educational purposes.

## Acknowledgments

- Archaeological research on Mohenjo-Daro and Harappa
- Three.js community for 3D web graphics
- WebXR community for VR web standards
- Educational institutions for testing and feedback

---

**Note**: This is an educational reconstruction based on archaeological evidence. Some details are interpretive and may not reflect the exact historical reality.
