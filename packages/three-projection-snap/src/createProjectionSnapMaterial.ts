import * as THREE from 'three'
import { applyProjectionSnap } from './applyProjectionSnap.js'
import type {
  ProjectionSnapController,
  ProjectionSnapOptions,
} from './types.js'

export function createProjectionSnapMaterial(
  parameters: THREE.MeshStandardMaterialParameters = {},
  options: ProjectionSnapOptions = {},
): {
  material: THREE.MeshStandardMaterial
  controller: ProjectionSnapController
} {
  const material = new THREE.MeshStandardMaterial(parameters)
  const controller = applyProjectionSnap(material, options)

  return { material, controller }
}
