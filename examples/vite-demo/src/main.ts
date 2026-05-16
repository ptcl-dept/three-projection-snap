import { createDemoControls } from './controls'
import { createScene } from './scene'

const canvas = document.getElementById('scene')

if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error('Demo canvas was not found.')
}

void start()

async function start() {
  const scene = await createScene(canvas as HTMLCanvasElement)
  createDemoControls(scene.controller, scene.setState)
}
