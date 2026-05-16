export const projectionSnapShaderChunk = /* glsl */ `
#ifndef THREE_PROJECTION_SNAP
#define THREE_PROJECTION_SNAP

uniform vec2 uProjectionSnapResolution;
uniform float uProjectionSnapStrength;
uniform float uProjectionSnapMode;
uniform float uProjectionSnapSnapZ;

vec2 projectionSnapRound(vec2 value, float mode) {
  if (mode < 0.5) {
    return floor(value);
  } else if (mode < 1.5) {
    return floor(value + 0.5);
  } else {
    return ceil(value);
  }
}

vec4 projectionSnapPosition(vec4 clipPosition) {
  vec3 ndc = clipPosition.xyz / clipPosition.w;

  vec2 screen = ndc.xy * 0.5 + 0.5;
  screen *= uProjectionSnapResolution;

  vec2 snappedScreen = projectionSnapRound(screen, uProjectionSnapMode);

  snappedScreen /= uProjectionSnapResolution;
  vec2 snappedNdc = snappedScreen * 2.0 - 1.0;

  vec2 finalNdc = mix(ndc.xy, snappedNdc, uProjectionSnapStrength);

  clipPosition.xy = finalNdc * clipPosition.w;

  return clipPosition;
}

#endif
`

export function injectProjectionSnapShader(vertexShader: string): string {
  if (vertexShader.includes('THREE_PROJECTION_SNAP')) {
    return vertexShader
  }

  if (!vertexShader.includes('#include <common>')) {
    throw new Error(
      'three-projection-snap: material vertex shader cannot be patched because #include <common> was not found.',
    )
  }

  if (!vertexShader.includes('#include <project_vertex>')) {
    throw new Error(
      'three-projection-snap: material vertex shader cannot be patched because #include <project_vertex> was not found.',
    )
  }

  return vertexShader
    .replace(
      '#include <common>',
      `#include <common>\n${projectionSnapShaderChunk}`,
    )
    .replace(
      '#include <project_vertex>',
      '#include <project_vertex>\ngl_Position = projectionSnapPosition(gl_Position);',
    )
}
