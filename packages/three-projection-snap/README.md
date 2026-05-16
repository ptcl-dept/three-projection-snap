# three-projection-snap

`three-projection-snap` is a small TypeScript package for screen-space vertex snapping in Three.js.

The package patches common Three.js materials so projected vertex positions are quantized onto a virtual screen-space grid in the vertex shader. Mesh geometry is not modified.

## Installation

```bash
npm install three-projection-snap three
```

`three` is a peer dependency and must be installed by the host project.

## Basic Usage

```ts
import * as THREE from 'three'
import { applyProjectionSnap } from 'three-projection-snap'

const material = new THREE.MeshStandardMaterial({ color: 'orange' })

const snap = applyProjectionSnap(material, {
  resolution: [320, 240],
  strength: 1,
  mode: 'round',
})

snap.setResolution(160, 120)
snap.setStrength(0.75)
```

Use the patched material on a normal mesh:

```ts
const mesh = new THREE.Mesh(geometry, material)
scene.add(mesh)
```

## API

### `applyProjectionSnap(material, options?)`

Patches a built-in Three.js material with screen-space vertex snapping and returns a controller.

```ts
applyProjectionSnap(
  material: THREE.Material,
  options?: ProjectionSnapOptions,
): ProjectionSnapController
```

Default options:

```ts
{
  resolution: [320, 240],
  strength: 1.0,
  mode: 'round',
  snapZ: false,
}
```

### `createProjectionSnapMaterial(parameters?, options?)`

Convenience helper for creating a `MeshStandardMaterial` and applying projection snapping.

```ts
const { material, controller } = createProjectionSnapMaterial(
  { color: 'orange' },
  { resolution: [160, 120] },
)
```

## How It Works

The package uses `material.onBeforeCompile` to inject uniforms and GLSL helpers into the material vertex shader.

Quantization happens after the normal Three.js projection chunk computes `gl_Position`:

```glsl
#include <project_vertex>
gl_Position = projectionSnapPosition(gl_Position);
```

The helper function divides clip-space coordinates by `w`, snaps `xy` in virtual screen space, and writes the snapped coordinates back into clip space.

## Known Limitations

- Shader injection depends on Three.js shader chunk names.
- Custom `ShaderMaterial` is not supported initially.
- Some complex materials may not patch correctly.
- The effect operates per vertex.
