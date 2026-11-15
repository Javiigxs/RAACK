// WebGL 2 renderer of the opening Earth. One program, three textures, one triangle.
// Code written with AI assistance (Claude) for team RAACK.

import { hexToLinear, lens, normalize, toModel } from './scene';
import { EARTH, type Vec3 } from './sequence';
import { FRAGMENT, VERTEX } from './shader';

export interface View {
  cam: Vec3;
  /** Tilt of the north pole toward the camera, radians. */
  tilt: number;
  /** Turn of the planet around its axis, radians. */
  spin: number;
  /** How much of the cloud cover is drawn: 1 (the default) is the mask as it is, 0 a clear sky. */
  clouds?: number;
}

/** Widest copy of each map the renderer keeps, in pixels. */
export type TextureLimit = number | { day: number; night: number; mask: number };

export interface EarthRenderer {
  readonly kind: 'webgl' | 'canvas';
  /** Sets the size of the picture in device pixels. */
  resize(width: number, height: number): void;
  draw(view: View): void;
  dispose(): void;
}

export interface EarthMaps {
  day: HTMLImageElement;
  night: HTMLImageElement;
  mask: HTMLImageElement;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? '';
    gl.deleteShader(shader);
    throw new Error(`Earth shader: ${log}`);
  }
  return shader;
}

/** Draws an image smaller when the device cannot hold it at full size. */
function fit(image: HTMLImageElement, maxWidth: number): TexImageSource {
  if (image.naturalWidth <= maxWidth) return image;
  const canvas = document.createElement('canvas');
  canvas.width = maxWidth;
  canvas.height = Math.round((image.naturalHeight * maxWidth) / image.naturalWidth);
  const ctx = canvas.getContext('2d');
  if (!ctx) return image;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Creates the renderer, or returns null when the browser has no WebGL 2 (the caller then falls back
 * to the 2D renderer). `maxTexture` caps the width of the maps: phones get half-size copies, and
 * a small globe can keep a smaller copy of the maps it barely shows.
 */
export function createWebglEarth(canvas: HTMLCanvasElement, maps: EarthMaps, maxTexture: TextureLimit): EarthRenderer | null {
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true });
  if (!gl) return null;

  let program: WebGLProgram;
  const textures: WebGLTexture[] = [];
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let vao: WebGLVertexArrayObject | null = null;

  const caps = typeof maxTexture === 'number' ? { day: maxTexture, night: maxTexture, mask: maxTexture } : maxTexture;

  function texture(unit: number, image: HTMLImageElement, srgb: boolean, cap: number): WebGLTexture {
    const tex = gl!.createTexture()!;
    gl!.activeTexture(gl!.TEXTURE0 + unit);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, false);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.pixelStorei(gl!.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl!.NONE);
    const limit = Math.min(cap, gl!.getParameter(gl!.MAX_TEXTURE_SIZE) as number);
    // sRGB storage: the sampler returns linear light, and the smaller copies are averaged in linear light too.
    gl!.texImage2D(gl!.TEXTURE_2D, 0, srgb ? gl!.SRGB8_ALPHA8 : gl!.RGBA8, gl!.RGBA, gl!.UNSIGNED_BYTE, fit(image, limit));
    gl!.generateMipmap(gl!.TEXTURE_2D);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.REPEAT);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    const aniso = gl!.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) {
      const most = gl!.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) as number;
      gl!.texParameterf(gl!.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, most));
    }
    return tex;
  }

  function build(): void {
    const vs = compile(gl!, gl!.VERTEX_SHADER, VERTEX);
    const fs = compile(gl!, gl!.FRAGMENT_SHADER, FRAGMENT);
    program = gl!.createProgram()!;
    gl!.attachShader(program, vs);
    gl!.attachShader(program, fs);
    gl!.linkProgram(program);
    gl!.deleteShader(vs);
    gl!.deleteShader(fs);
    if (!gl!.getProgramParameter(program, gl!.LINK_STATUS)) throw new Error(`Earth program: ${gl!.getProgramInfoLog(program) ?? ''}`);
    gl!.useProgram(program);
    uniforms = {};
    for (const name of ['uCam', 'uLens', 'uToModel', 'uSun', 'uSkyDay', 'uSkyDusk', 'uPixel', 'uClouds', 'uDay', 'uNight', 'uMask']) {
      uniforms[name] = gl!.getUniformLocation(program, name);
    }
    vao = gl!.createVertexArray();
    gl!.bindVertexArray(vao);
    textures.length = 0;
    textures.push(texture(0, maps.day, true, caps.day), texture(1, maps.night, true, caps.night), texture(2, maps.mask, false, caps.mask));
    gl!.uniform1i(uniforms.uDay, 0);
    gl!.uniform1i(uniforms.uNight, 1);
    gl!.uniform1i(uniforms.uMask, 2);
    gl!.uniform3fv(uniforms.uSun, normalize(EARTH.sun));
    gl!.uniform3fv(uniforms.uSkyDay, hexToLinear(EARTH.skyDay));
    gl!.uniform3fv(uniforms.uSkyDusk, hexToLinear(EARTH.skyDusk));
    gl!.disable(gl!.DEPTH_TEST);
    gl!.disable(gl!.BLEND);
    gl!.clearColor(0, 0, 0, 0);
  }

  try {
    build();
  } catch (error) {
    console.warn(error);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }

  let lost = false;
  let last: View | null = null;
  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    try {
      build();
      lost = false;
      if (last) api.draw(last);
    } catch (error) {
      console.warn(error);
    }
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const api: EarthRenderer = {
    kind: 'webgl',
    resize(width, height) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    },
    draw(view) {
      last = view;
      if (lost) return;
      const w = canvas.width;
      const h = canvas.height;
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const [lx, ly] = lens(w / h);
      gl.uniform3fv(uniforms.uCam, view.cam);
      gl.uniform2f(uniforms.uLens, lx, ly);
      gl.uniform1f(uniforms.uPixel, (2 * ly) / h);
      gl.uniform1f(uniforms.uClouds, view.clouds ?? 1);
      const m = toModel(view.tilt, view.spin);
      // GLSL stores matrices by columns
      gl.uniformMatrix3fv(uniforms.uToModel, false, [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      canvas.removeEventListener('webglcontextlost', onLost);
      canvas.removeEventListener('webglcontextrestored', onRestored);
      for (const tex of textures) gl.deleteTexture(tex);
      gl.deleteProgram(program);
      gl.deleteVertexArray(vao);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  };
  return api;
}
