import type * as THREE from 'three'

export type ProjectionSnapMode = 'floor' | 'round' | 'ceil'

export type ProjectionSnapOptions = {
  resolution?: [number, number]
  strength?: number
  mode?: ProjectionSnapMode
  snapZ?: boolean
}

export type ProjectionSnapController = {
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

export type NormalizedProjectionSnapOptions = {
  resolution: [number, number]
  strength: number
  mode: ProjectionSnapMode
  modeValue: number
  snapZ: boolean
}
