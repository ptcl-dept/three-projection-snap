import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import {
  applyProjectionSnap,
  normalizeProjectionSnapOptions,
} from '../dist/applyProjectionSnap.js'

function compileMaterial(material) {
  const shader = {
    vertexShader: [
      '#include <common>',
      'void main() {',
      '  #include <project_vertex>',
      '}',
    ].join('\n'),
    uniforms: {},
  }

  material.onBeforeCompile(shader, {})
  return shader
}

test('normalizeProjectionSnapOptions applies defaults', () => {
  assert.deepEqual(normalizeProjectionSnapOptions(), {
    resolution: [320, 240],
    strength: 1,
    mode: 'round',
    modeValue: 1,
    snapZ: false,
  })
})

test('normalizeProjectionSnapOptions clamps strength and maps modes', () => {
  assert.deepEqual(
    normalizeProjectionSnapOptions({
      resolution: [160, 90],
      strength: -2,
      mode: 'floor',
      snapZ: true,
    }),
    {
      resolution: [160, 90],
      strength: 0,
      mode: 'floor',
      modeValue: 0,
      snapZ: true,
    },
  )

  assert.equal(
    normalizeProjectionSnapOptions({ strength: 2, mode: 'ceil' }).strength,
    1,
  )
  assert.equal(normalizeProjectionSnapOptions({ mode: 'ceil' }).modeValue, 2)
})

test('normalizeProjectionSnapOptions rejects invalid resolution and mode', () => {
  assert.throws(
    () => normalizeProjectionSnapOptions({ resolution: [0, 240] }),
    /resolution width/,
  )
  assert.throws(
    () => normalizeProjectionSnapOptions({ resolution: [320, Number.NaN] }),
    /resolution height/,
  )
  assert.throws(
    () => normalizeProjectionSnapOptions({ mode: 'nearest' }),
    /mode must be/,
  )
})

test('applyProjectionSnap injects uniforms and syncs controller changes', () => {
  const material = new THREE.MeshBasicMaterial()
  const controller = applyProjectionSnap(material, {
    resolution: [160, 120],
    strength: 0.5,
    mode: 'floor',
    snapZ: true,
  })

  const shader = compileMaterial(material)

  assert.match(shader.vertexShader, /projectionSnapPosition/)
  assert.deepEqual(
    shader.uniforms.uProjectionSnapResolution.value.toArray(),
    [160, 120],
  )
  assert.equal(shader.uniforms.uProjectionSnapStrength.value, 0.5)
  assert.equal(shader.uniforms.uProjectionSnapMode.value, 0)
  assert.equal(shader.uniforms.uProjectionSnapSnapZ.value, 1)

  controller.setResolution(80, 60)
  controller.setStrength(2)
  controller.setMode('ceil')
  controller.setSnapZ(false)

  assert.deepEqual(
    shader.uniforms.uProjectionSnapResolution.value.toArray(),
    [80, 60],
  )
  assert.equal(shader.uniforms.uProjectionSnapStrength.value, 1)
  assert.equal(shader.uniforms.uProjectionSnapMode.value, 2)
  assert.equal(shader.uniforms.uProjectionSnapSnapZ.value, 0)
})

test('applyProjectionSnap reuses an existing controller and updates its state', () => {
  const material = new THREE.MeshBasicMaterial()
  const controller = applyProjectionSnap(material, { resolution: [160, 120] })
  const sameController = applyProjectionSnap(material, {
    resolution: [64, 32],
    strength: 0.25,
    mode: 'floor',
    snapZ: true,
  })

  assert.equal(sameController, controller)
  assert.deepEqual(controller.getResolution(), [64, 32])
  assert.equal(controller.getStrength(), 0.25)
  assert.equal(controller.getMode(), 'floor')
  assert.equal(controller.getSnapZ(), true)
})

test('applyProjectionSnap composes and restores material hooks', () => {
  const material = new THREE.MeshBasicMaterial()
  let previousHookCalled = false

  const previousOnBeforeCompile = (shader) => {
    previousHookCalled = true
    shader.uniforms.fromPreviousHook = { value: 1 }
  }
  const previousCustomProgramCacheKey = () => 'previous-key'

  material.onBeforeCompile = previousOnBeforeCompile
  material.customProgramCacheKey = previousCustomProgramCacheKey

  const controller = applyProjectionSnap(material)
  const shader = compileMaterial(material)

  assert.equal(previousHookCalled, true)
  assert.equal(shader.uniforms.fromPreviousHook.value, 1)
  assert.equal(
    material.customProgramCacheKey(),
    'previous-key|three-projection-snap:v1',
  )

  controller.dispose()

  assert.equal(material.onBeforeCompile, previousOnBeforeCompile)
  assert.equal(material.customProgramCacheKey, previousCustomProgramCacheKey)
})
