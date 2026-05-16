import type {
  ProjectionSnapController,
  ProjectionSnapMode,
} from 'three-projection-snap'

export type DemoControlState = {
  resolutionX: number
  resolutionY: number
  strength: number
  mode: ProjectionSnapMode
  animateObject: boolean
  animateCamera: boolean
  wireframe: boolean
}

export type DemoControls = {
  state: DemoControlState
  update(): void
}

export function createDemoControls(
  controller: ProjectionSnapController,
  onChange: (state: DemoControlState) => void,
): DemoControls {
  const values = getElement<HTMLDivElement>('values')
  const resolutionX = getElement<HTMLInputElement>('resolutionX')
  const resolutionY = getElement<HTMLInputElement>('resolutionY')
  const strength = getElement<HTMLInputElement>('strength')
  const mode = getElement<HTMLSelectElement>('mode')
  const animateObject = getElement<HTMLInputElement>('animateObject')
  const animateCamera = getElement<HTMLInputElement>('animateCamera')
  const wireframe = getElement<HTMLInputElement>('wireframe')

  const state: DemoControlState = {
    resolutionX: Number(resolutionX.value),
    resolutionY: Number(resolutionY.value),
    strength: Number(strength.value),
    mode: mode.value as ProjectionSnapMode,
    animateObject: animateObject.checked,
    animateCamera: animateCamera.checked,
    wireframe: wireframe.checked,
  }

  const update = () => {
    state.resolutionX = Math.max(1, Number(resolutionX.value))
    state.resolutionY = Math.max(1, Number(resolutionY.value))
    state.strength = Number(strength.value)
    state.mode = mode.value as ProjectionSnapMode
    state.animateObject = animateObject.checked
    state.animateCamera = animateCamera.checked
    state.wireframe = wireframe.checked

    controller.setResolution(state.resolutionX, state.resolutionY)
    controller.setStrength(state.strength)
    controller.setMode(state.mode)

    values.textContent = [
      `Virtual resolution: ${state.resolutionX} × ${state.resolutionY}`,
      `Strength: ${state.strength.toFixed(2)}`,
      `Mode: ${state.mode}`,
    ].join('\n')

    onChange(state)
  }

  const inputs = [
    resolutionX,
    resolutionY,
    strength,
    mode,
    animateObject,
    animateCamera,
    wireframe,
  ]

  for (const input of inputs) {
    input.addEventListener('input', update)
    input.addEventListener('change', update)
  }

  update()

  return { state, update }
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id)

  if (!element) {
    throw new Error(`Missing required demo element: #${id}`)
  }

  return element as T
}
