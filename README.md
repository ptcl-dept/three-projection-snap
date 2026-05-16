# three-projection-snap

`three-projection-snap` is a small TypeScript package for screen-space vertex snapping in Three.js.

This is not a nostalgia filter. It is a small graphics programming experiment that exposes where quantization occurs in the projection pipeline.

The package patches common Three.js materials so projected vertex positions are quantized onto a virtual screen-space grid in the vertex shader. Mesh geometry is not modified.

## Why This Exists

Most examples present polygon jitter as an aesthetic effect. This project treats it as a projection pipeline experiment instead.

Each vertex is transformed normally into clip space. After projection, the shader converts the clip position into normalized device coordinates, maps it to a virtual screen resolution, snaps that screen position, and converts it back to clip space.

That makes it easier to see how smooth object or camera motion can become discrete polygon motion when projection precision is reduced.

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
): ProjectionSnapController;
```

Default options:

```ts
{
  resolution: [320, 240],
  strength: 1.0,
  mode: "round",
  snapZ: false
}
```

### `ProjectionSnapOptions`

```ts
type ProjectionSnapMode = 'floor' | 'round' | 'ceil'

type ProjectionSnapOptions = {
  resolution?: [number, number]
  strength?: number
  mode?: ProjectionSnapMode
  snapZ?: boolean
}
```

- `resolution`: virtual screen grid size. Values must be positive finite numbers.
- `strength`: blend between unsnapped and snapped positions. Values are clamped to `[0, 1]`.
- `mode`: quantization mode. `floor`, `round`, and `ceil` map to shader values `0`, `1`, and `2`.
- `snapZ`: stored and exposed for future depth quantization. It is disabled by default and does not visibly change depth in the MVP.

### `ProjectionSnapController`

```ts
type ProjectionSnapController = {
  material: THREE.Material

  setResolution(width: number, height: number): void
  setStrength(strength: number): void
  setMode(mode: ProjectionSnapMode): void
  setSnapZ(enabled: boolean): void

  getResolution(): [number, number]
  getStrength(): number
  getMode(): ProjectionSnapMode
  getSnapZ(): boolean

  dispose(): void
}
```

Controller setters update shader uniforms at runtime. Values are stored immediately and synchronized when Three.js compiles the shader.

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

The helper function divides clip-space coordinates by `w`, snaps `xy` in virtual screen space, and writes the snapped coordinates back into clip space. The original geometry buffers are untouched.

## Run The Demo

```bash
npm install
npm run dev
```

Or run it directly from the demo workspace:

```bash
cd examples
npm install
npm run dev
```

The demo uses a low-poly procedural mesh, orbit controls, a checker floor, and runtime controls for resolution, strength, mode, animation, and wireframe display.

### Demo Model License

The Vite demo uses [Low poly fox by PixelMannen (Animated)](https://sketchfab.com/3d-models/low-poly-fox-by-pixelmannen-animated-371dea88d7e04a76af5763f2a36866bc) by [tomkranis](https://sketchfab.com/tomkranis), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/).

If you reuse the demo model, keep the required author credit with the model.

## Known Limitations

- Shader injection depends on Three.js shader chunk names.
- Custom `ShaderMaterial` is not supported initially.
- Some complex materials may not patch correctly.
- The effect operates per vertex.
- No triangle subdivision.
- No affine texture mapping.
- No dithering.
- No historical hardware emulation.
