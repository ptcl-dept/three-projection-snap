import assert from 'node:assert/strict'
import test from 'node:test'
import { injectProjectionSnapShader } from '../dist/shader.js'

const baseVertexShader = [
  '#include <common>',
  'void main() {',
  '  vec3 transformed = vec3(position);',
  '  #include <project_vertex>',
  '}',
].join('\n')

test('injectProjectionSnapShader injects helpers and projection hook', () => {
  const shader = injectProjectionSnapShader(baseVertexShader)

  assert.match(shader, /#define THREE_PROJECTION_SNAP/)
  assert.match(shader, /uniform vec2 uProjectionSnapResolution;/)
  assert.match(shader, /gl_Position = projectionSnapPosition\(gl_Position\);/)
})

test('injectProjectionSnapShader is idempotent', () => {
  const shader = injectProjectionSnapShader(baseVertexShader)

  assert.equal(injectProjectionSnapShader(shader), shader)
})

test('injectProjectionSnapShader reports unsupported shader chunks', () => {
  assert.throws(
    () =>
      injectProjectionSnapShader('void main() {\n#include <project_vertex>\n}'),
    /#include <common> was not found/,
  )

  assert.throws(
    () => injectProjectionSnapShader('#include <common>\nvoid main() {}'),
    /#include <project_vertex> was not found/,
  )
})
