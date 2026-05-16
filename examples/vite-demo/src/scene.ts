import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { DemoControlState } from './controls'
import { createCheckerFloor, createDemoObjects } from './demoObjects'

export async function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x090b10)

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
  camera.position.set(6.2, 2.4, 7.2)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setScissorTest(true)

  const controls = new OrbitControls(camera, canvas)
  controls.enableDamping = true
  controls.target.set(0, 0.7, 0)

  const ambientLight = new THREE.HemisphereLight(0xffffff, 0x2d3240, 1.25)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6)
  keyLight.position.set(4, 6, 3)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.set(1024, 1024)
  scene.add(keyLight)

  scene.add(createCheckerFloor())

  const demoObjects = await createDemoObjects()
  scene.add(demoObjects.group)

  const grid = new THREE.GridHelper(18, 18, 0xffffff, 0x000000)
  grid.position.y = 0.01
  scene.add(grid)

  const clock = new THREE.Clock()
  const state: DemoControlState = {
    resolutionX: 160,
    resolutionY: 120,
    strength: 1,
    mode: 'round',
    animateObject: true,
    animateCamera: false,
    wireframe: false,
  }

  const resize = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight

    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false)
    }
  }

  const setState = (nextState: DemoControlState) => {
    Object.assign(state, nextState)
    demoObjects.normalWireframe.visible = state.wireframe
    demoObjects.snappedWireframe.visible = state.wireframe
  }

  const render = () => {
    const delta = clock.getDelta()
    const elapsed = clock.elapsedTime

    if (state.animateObject) {
      for (const mixer of demoObjects.mixers) {
        mixer.update(delta)
      }

      demoObjects.group.rotation.set(0, elapsed * 0.28, 0)
    }

    if (state.animateCamera) {
      const radius = 7.2
      camera.position.x = Math.cos(elapsed * 0.28) * radius
      camera.position.z = Math.sin(elapsed * 0.28) * radius
      camera.position.y = 2.25 + Math.sin(elapsed * 0.7) * 0.25
      camera.lookAt(controls.target)
    }

    controls.update()
    resize()
    renderSplitScreen()
    requestAnimationFrame(render)
  }

  const renderSplitScreen = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    const leftWidth = Math.floor(width / 2)
    const rightWidth = width - leftWidth

    renderer.setViewport(0, 0, width, height)
    renderer.setScissor(0, 0, width, height)
    renderer.clear()

    camera.aspect = leftWidth / height
    camera.updateProjectionMatrix()

    demoObjects.normal.visible = true
    demoObjects.normalWireframe.visible = state.wireframe
    demoObjects.snapped.visible = false
    demoObjects.snappedWireframe.visible = false
    renderer.setViewport(0, 0, leftWidth, height)
    renderer.setScissor(0, 0, leftWidth, height)
    renderer.render(scene, camera)

    camera.aspect = rightWidth / height
    camera.updateProjectionMatrix()

    demoObjects.normal.visible = false
    demoObjects.normalWireframe.visible = false
    demoObjects.snapped.visible = true
    demoObjects.snappedWireframe.visible = state.wireframe
    renderer.setViewport(leftWidth, 0, rightWidth, height)
    renderer.setScissor(leftWidth, 0, rightWidth, height)
    renderer.render(scene, camera)

    demoObjects.normal.visible = true
    demoObjects.snapped.visible = true
    demoObjects.normalWireframe.visible = state.wireframe
    demoObjects.snappedWireframe.visible = state.wireframe
  }

  resize()
  render()

  window.addEventListener('resize', resize)

  return {
    controller: demoObjects.controller,
    setState,
  }
}
