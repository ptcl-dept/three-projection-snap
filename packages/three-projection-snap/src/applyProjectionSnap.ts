import * as THREE from 'three'
import { injectProjectionSnapShader } from './shader.js'
import type {
  NormalizedProjectionSnapOptions,
  ProjectionSnapController,
  ProjectionSnapMode,
  ProjectionSnapOptions,
} from './types.js'

const DEFAULT_OPTIONS: NormalizedProjectionSnapOptions = {
  resolution: [320, 240],
  strength: 1,
  mode: 'round',
  modeValue: 1,
  snapZ: false,
}

type ProjectionSnapUniforms = {
  uProjectionSnapResolution: { value: THREE.Vector2 }
  uProjectionSnapStrength: { value: number }
  uProjectionSnapMode: { value: number }
  uProjectionSnapSnapZ: { value: number }
}

type PatchableMaterial = THREE.Material & {
  onBeforeCompile: (
    shader: THREE.WebGLProgramParametersWithUniforms,
    renderer: THREE.WebGLRenderer,
  ) => void
  customProgramCacheKey: () => string
  isShaderMaterial?: boolean
}

const controllerByMaterial = new WeakMap<
  THREE.Material,
  ProjectionSnapController
>()

export function applyProjectionSnap(
  material: THREE.Material,
  options: ProjectionSnapOptions = {},
): ProjectionSnapController {
  assertPatchableMaterial(material)

  const existingController = controllerByMaterial.get(material)
  if (existingController) {
    const state = normalizeProjectionSnapOptions(options)
    existingController.setResolution(state.resolution[0], state.resolution[1])
    existingController.setStrength(state.strength)
    existingController.setMode(state.mode)
    existingController.setSnapZ(state.snapZ)

    return existingController
  }

  const patchableMaterial = material as PatchableMaterial
  const previousOnBeforeCompile = patchableMaterial.onBeforeCompile
  const previousCustomProgramCacheKey = patchableMaterial.customProgramCacheKey
  const state = normalizeProjectionSnapOptions(options)
  let uniforms: ProjectionSnapUniforms | undefined
  let disposed = false

  const syncUniforms = () => {
    if (!uniforms) {
      return
    }

    uniforms.uProjectionSnapResolution.value.set(
      state.resolution[0],
      state.resolution[1],
    )
    uniforms.uProjectionSnapStrength.value = state.strength
    uniforms.uProjectionSnapMode.value = state.modeValue
    uniforms.uProjectionSnapSnapZ.value = state.snapZ ? 1 : 0
  }

  patchableMaterial.onBeforeCompile = (shader, renderer) => {
    previousOnBeforeCompile.call(material, shader, renderer)

    shader.vertexShader = injectProjectionSnapShader(shader.vertexShader)

    uniforms = {
      uProjectionSnapResolution: {
        value: new THREE.Vector2(state.resolution[0], state.resolution[1]),
      },
      uProjectionSnapStrength: { value: state.strength },
      uProjectionSnapMode: { value: state.modeValue },
      uProjectionSnapSnapZ: { value: state.snapZ ? 1 : 0 },
    }

    Object.assign(shader.uniforms, uniforms)
    syncUniforms()
  }

  patchableMaterial.customProgramCacheKey = () => {
    const previousKey = previousCustomProgramCacheKey.call(material)
    return `${previousKey}|three-projection-snap:v1`
  }

  material.needsUpdate = true

  const controller: ProjectionSnapController = {
    material,

    setResolution(width: number, height: number) {
      state.resolution = normalizeResolution(width, height)
      syncUniforms()
    },

    setStrength(strength: number) {
      state.strength = clamp01(strength)
      syncUniforms()
    },

    setMode(mode: ProjectionSnapMode) {
      assertProjectionSnapMode(mode)
      state.mode = mode
      state.modeValue = modeToUniformValue(mode)
      syncUniforms()
    },

    setSnapZ(enabled: boolean) {
      state.snapZ = Boolean(enabled)
      syncUniforms()
    },

    getResolution() {
      return [...state.resolution]
    },

    getStrength() {
      return state.strength
    },

    getMode() {
      return state.mode
    },

    getSnapZ() {
      return state.snapZ
    },

    dispose() {
      if (disposed) {
        return
      }

      disposed = true
      patchableMaterial.onBeforeCompile = previousOnBeforeCompile
      patchableMaterial.customProgramCacheKey = previousCustomProgramCacheKey
      uniforms = undefined
      controllerByMaterial.delete(material)
      material.needsUpdate = true
    },
  }

  controllerByMaterial.set(material, controller)

  return controller
}

export function normalizeProjectionSnapOptions(
  options: ProjectionSnapOptions = {},
): NormalizedProjectionSnapOptions {
  const mode = options.mode ?? DEFAULT_OPTIONS.mode
  assertProjectionSnapMode(mode)

  const [width, height] = options.resolution ?? DEFAULT_OPTIONS.resolution

  return {
    resolution: normalizeResolution(width, height),
    strength: clamp01(options.strength ?? DEFAULT_OPTIONS.strength),
    mode,
    modeValue: modeToUniformValue(mode),
    snapZ: options.snapZ ?? DEFAULT_OPTIONS.snapZ,
  }
}

function assertPatchableMaterial(material: THREE.Material): void {
  if ((material as PatchableMaterial).isShaderMaterial) {
    throw new Error(
      'three-projection-snap: ShaderMaterial is not supported by applyProjectionSnap in the first version.',
    )
  }

  if (typeof material.onBeforeCompile !== 'function') {
    throw new Error(
      'three-projection-snap: material cannot be patched because it does not expose onBeforeCompile.',
    )
  }
}

function normalizeResolution(width: number, height: number): [number, number] {
  if (!Number.isFinite(width) || width <= 0) {
    throw new Error(
      'three-projection-snap: resolution width must be a positive finite number.',
    )
  }

  if (!Number.isFinite(height) || height <= 0) {
    throw new Error(
      'three-projection-snap: resolution height must be a positive finite number.',
    )
  }

  return [width, height]
}

function assertProjectionSnapMode(
  mode: ProjectionSnapMode,
): asserts mode is ProjectionSnapMode {
  if (mode !== 'floor' && mode !== 'round' && mode !== 'ceil') {
    throw new Error(
      'three-projection-snap: mode must be "floor", "round", or "ceil".',
    )
  }
}

function modeToUniformValue(mode: ProjectionSnapMode): number {
  switch (mode) {
    case 'floor':
      return 0
    case 'round':
      return 1
    case 'ceil':
      return 2
  }
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_OPTIONS.strength
  }

  return Math.min(1, Math.max(0, value))
}
