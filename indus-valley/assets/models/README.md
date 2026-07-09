# Indus Valley 3D Models

This directory contains 3D models for the Indus Valley Civilization VR experience.

## Current Models (Placeholder)

The current implementation uses basic A-Frame primitives (boxes, cylinders, planes) to represent archaeological sites. These can be replaced with more detailed 3D models as they become available.

## Planned Models

### Archaeological Sites
- **Mohenjo-daro**: Great Bath, Citadel, Drainage System
- **Harappa**: Granaries, Citadel, Workers Quarters
- **Dholavira**: Water Reservoirs, Multi-layered City
- **Lothal**: Ancient Dock, Bead Factory, Warehouses
- **Kalibangan**: Fire Altars, Plowed Fields

### Artifacts
- **Indus Valley Seals**: Various animal motifs and script
- **Dancing Girl**: Bronze statuette
- **Pottery**: Various shapes and designs
- **Jewelry**: Beads, bangles, necklaces
- **Tools**: Agricultural and craft tools

## File Formats

- **GLTF/GLB**: Preferred format for A-Frame compatibility
- **OBJ**: Alternative format with MTL materials
- **FBX**: For complex animations (if needed)

## Model Requirements

- **Polygon Count**: Optimized for VR (under 10k triangles per model)
- **Textures**: 1024x1024 or 2048x2048 resolution
- **Materials**: PBR materials for realistic lighting
- **Scale**: Accurate to real-world proportions
- **Origin**: Centered at (0,0,0) with appropriate orientation

## Usage in A-Frame

```html
<a-entity gltf-model="#mohenjo-daro-model" position="0 0 -20"></a-entity>
```

## Future Enhancements

1. **Animated Models**: Moving parts for water systems, rotating wheels
2. **Interactive Elements**: Clickable artifacts with detailed information
3. **Environmental Effects**: Dust, water, fire animations
4. **Sound Integration**: Ambient sounds for each site
5. **Lighting**: Dynamic lighting based on time of day
