import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  applyProjectionSnap,
  type ProjectionSnapController,
  type ProjectionSnapMode,
} from 'three-projection-snap'

const MODEL_URL = `${import.meta.env.BASE_URL}low_poly_fox_by_pixelmannen_animated/scene.gltf`
const MODEL_TARGET_HEIGHT = 1.35
const MODEL_FLOOR_CLEARANCE = 0.8

export async function createDemoObjects() {
  const group = new THREE.Group()
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(MODEL_URL)

  const sourceModel = gltf.scene
  sourceModel.name = 'low_poly_fox_by_pixelmannen_animated'
  normalizeModel(sourceModel)

  const normalModel = SkeletonUtils.clone(sourceModel)
  const snappedModel = SkeletonUtils.clone(sourceModel)
  const controllers: ProjectionSnapController[] = []
  configureMeshes(normalModel, (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
  })
  configureMeshes(snappedModel, (mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.material = cloneMaterials(mesh.material)

    for (const material of collectMaterials(mesh.material)) {
      controllers.push(
        applyProjectionSnap(material, {
          resolution: [160, 120],
          strength: 1,
          mode: 'round',
        }),
      )
    }
  })

  const normalWireframe = createWireframeClone(normalModel)
  const snappedWireframe = createWireframeClone(snappedModel)

  group.add(normalModel, snappedModel, normalWireframe, snappedWireframe)

  const controller = createCompositeController(controllers)
  const mixers = createAnimationMixers(
    gltf.animations,
    normalModel,
    snappedModel,
    normalWireframe,
    snappedWireframe,
  )

  return {
    group,
    normal: normalModel,
    snapped: snappedModel,
    normalWireframe,
    snappedWireframe,
    mixers,
    controller,
  }
}

function createWireframeClone(model: THREE.Object3D): THREE.Object3D {
  const wireframe = SkeletonUtils.clone(model)
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x1b1f2a,
    wireframe: true,
    transparent: true,
    opacity: 1,
    depthTest: true,
  })
  configureMeshes(wireframe, (mesh) => {
    mesh.castShadow = false
    mesh.receiveShadow = false
    mesh.material = wireframeMaterial
  })
  wireframe.visible = false

  return wireframe
}

function normalizeModel(model: THREE.Object3D): void {
  const box = new THREE.Box3().setFromObject(model)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const scale = MODEL_TARGET_HEIGHT / size.y

  model.scale.setScalar(scale)
  model.position.set(
    -center.x * scale,
    -box.min.y * scale + MODEL_FLOOR_CLEARANCE,
    -center.z * scale,
  )
  model.rotation.y = Math.PI * 0.5
}

function createAnimationMixers(
  clips: THREE.AnimationClip[],
  ...roots: THREE.Object3D[]
): THREE.AnimationMixer[] {
  if (clips.length === 0) {
    return []
  }

  return roots.map((root) => {
    const mixer = new THREE.AnimationMixer(root)

    for (const clip of clips) {
      mixer.clipAction(clip).play()
    }

    return mixer
  })
}

function configureMeshes(
  object: THREE.Object3D,
  configure: (mesh: THREE.Mesh) => void,
): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      configure(child)
    }
  })
}

function collectMaterials(
  material: THREE.Material | THREE.Material[],
): THREE.Material[] {
  return Array.isArray(material) ? material : [material]
}

function cloneMaterials(
  material: THREE.Material | THREE.Material[],
): THREE.Material | THREE.Material[] {
  return Array.isArray(material)
    ? material.map((entry) => entry.clone())
    : material.clone()
}

function createCompositeController(
  controllers: ProjectionSnapController[],
): ProjectionSnapController {
  if (controllers.length === 0) {
    throw new Error('No patchable materials were found in the demo model.')
  }

  const [primary] = controllers
  let resolution = primary.getResolution()
  let strength = primary.getStrength()
  let mode = primary.getMode()
  let snapZ = primary.getSnapZ()

  return {
    material: primary.material,

    setResolution(width: number, height: number) {
      resolution = [width, height]
      for (const controller of controllers) {
        controller.setResolution(width, height)
      }
    },

    setStrength(nextStrength: number) {
      strength = nextStrength
      for (const controller of controllers) {
        controller.setStrength(nextStrength)
      }
    },

    setMode(nextMode: ProjectionSnapMode) {
      mode = nextMode
      for (const controller of controllers) {
        controller.setMode(nextMode)
      }
    },

    setSnapZ(enabled: boolean) {
      snapZ = enabled
      for (const controller of controllers) {
        controller.setSnapZ(enabled)
      }
    },

    getResolution() {
      return [...resolution]
    },

    getStrength() {
      return strength
    },

    getMode() {
      return mode
    },

    getSnapZ() {
      return snapZ
    },

    dispose() {
      for (const controller of controllers) {
        controller.dispose()
      }
    },
  }
}

export function createCheckerFloor(): THREE.Mesh {
  const size = 18
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Could not create checker texture canvas.')
  }

  const cells = 16
  const cellSize = canvas.width / cells
  context.fillStyle = '#f5f5f0'
  context.fillRect(0, 0, canvas.width, canvas.height)

  for (let y = 0; y < cells; y += 1) {
    for (let x = 0; x < cells; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? '#f8f8f4' : '#202020'
      context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
    }
  }

  context.strokeStyle = 'rgba(0, 0, 0, 0.72)'
  context.lineWidth = 2
  for (let i = 0; i <= cells; i += 1) {
    const position = i * cellSize
    context.beginPath()
    context.moveTo(position, 0)
    context.lineTo(position, canvas.height)
    context.stroke()
    context.beginPath()
    context.moveTo(0, position)
    context.lineTo(canvas.width, position)
    context.stroke()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 2)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0,
    }),
  )

  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true

  return floor
}
