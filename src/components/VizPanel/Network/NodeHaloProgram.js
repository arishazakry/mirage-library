/**
 * @fileoverview A node renderer for a blurry halo in Sigma.js, useful for creating a heatmap effect.
 * @see https://github.com/Yomguithereal/sigma-experiments/blob/master/renderers/src/node/node.halo.ts
 * This is an updated version for Sigma.js v3+
 */

import { NodeProgram } from "sigma/rendering";
import { floatColor } from "sigma/utils";

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
attribute float a_size;
attribute float a_angle;
attribute vec4 a_color;
attribute float a_intensity;

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;
uniform float u_ignoreZoom;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_border;
varying float v_intensity;

const float bias = 255.0 / 254.0;
const float marginRatio = 1.05;

void main() {
  float size = a_size * u_correctionRatio / u_sizeRatio * u_ignoreZoom * 4.0;
  vec2 diffVector = size * vec2(cos(a_angle), sin(a_angle));
  vec2 position = a_position + diffVector * marginRatio;

  gl_Position = vec4(
    (u_matrix * vec3(position, 1)).xy,
    0,
    1
  );

  v_border = u_correctionRatio;
  v_diffVector = diffVector;
  v_radius = size / 2.0 / marginRatio;
  v_color = a_color;
  v_color.a *= bias;
  v_intensity = a_intensity;
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec4 v_color;
varying vec2 v_diffVector;
varying float v_radius;
varying float v_border;
varying float v_intensity;

const vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

void main(void) {
  float dist = length(v_diffVector);
  float intensity = v_intensity * (v_radius - dist) / v_radius;

  if (dist < v_radius) {
    gl_FragColor = vec4(v_color * intensity);
  } else {
    gl_FragColor = transparent;
  }
}
`;

const { FLOAT, UNSIGNED_BYTE } = WebGLRenderingContext;

export default class NodeHaloProgram extends NodeProgram {
  ANGLE_1 = 0;
  ANGLE_2 = (2 * Math.PI) / 3;
  ANGLE_3 = (4 * Math.PI) / 3;

  getDefinition() {
    return {
      VERTICES: 3,
      ARRAY_ITEMS_PER_VERTEX: 6,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
      METHOD: WebGLRenderingContext.TRIANGLES,
      UNIFORMS: ["u_sizeRatio", "u_correctionRatio", "u_matrix", "u_ignoreZoom"],
      ATTRIBUTES: [
        { name: "a_position", size: 2, type: FLOAT },
        { name: "a_size", size: 1, type: FLOAT },
        { name: "a_color", size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: "a_angle", size: 1, type: FLOAT },
        { name: "a_intensity", size: 1, type: FLOAT },
      ],
      CONSTANT_DATA: [[NodeHaloProgram.ANGLE_1], [NodeHaloProgram.ANGLE_2], [NodeHaloProgram.ANGLE_3]],
    };
  }
  constructor(gl, pickingBuffer, renderer) {
      super(gl, pickingBuffer, renderer);
    }
  // ✅ RENAMED from processVisibleItem and signature updated
  processVisibleItem(i,startIndex,data) {
    const array = this.array;
    const color = floatColor(data.haloColor || data.color);
    const intensity = typeof data.haloIntensity === "number" ? data.haloIntensity : 1;
    const size = Math.max(typeof data.haloSize === "number" ? data.haloSize : 0, data.size);

    const ANGLE_1 = 0;
    const ANGLE_2 = (2 * Math.PI) / 3;
    const ANGLE_3 = (4 * Math.PI) / 3;

    let idx = startIndex;

    array[idx++] = data.x;
    array[idx++] = data.y;
    array[idx++] = size;
    array[idx++] = color;
    array[idx++] = ANGLE_1;
    array[idx++] = intensity;

    array[idx++] = data.x;
    array[idx++] = data.y;
    array[idx++] = size;
    array[idx++] = color;
    array[idx++] = ANGLE_2;
    array[idx++] = intensity;

    array[idx++] = data.x;
    array[idx++] = data.y;
    array[idx++] = size;
    array[idx++] = color;
    array[idx++] = ANGLE_3;
    array[idx++] = intensity;
    return 18;
  }

  // ✅ NEW METHOD to set uniforms, required by the new API
  setUniforms(params, uniforms) {
    const { gl, u_sizeRatio, u_correctionRatio, u_matrix, u_ignoreZoom } = uniforms;

    gl.uniform1f(u_ignoreZoom, 1);
    // NOTE: uncomment next line to disable zoom impact.
    gl.uniform1f(u_ignoreZoom, 1 / params.sizeRatio);
    gl.uniform1f(u_sizeRatio, params.sizeRatio);
    gl.uniform1f(u_correctionRatio, params.correctionRatio);
    gl.uniformMatrix3fv(u_matrix, false, params.matrix);
  }
  
  // ✅ RENAMED from draw to render, logic simplified
  // render() {
  //   // this.gl.drawArrays(this.gl.TRIANGLES, 0, this.verticesCount);
  // }
  // renderProgram(params, programInfo) {
  //     if (!programInfo.isPicking) {
  //       // Rebind texture (since it's been just unbound by picking):
  //       const gl = programInfo.gl;
  //       gl.drawArrays(gl.TRIANGLES, 0, this.verticesCount);
  //     }
  //     super.renderProgram(params, programInfo);
  //   }
}