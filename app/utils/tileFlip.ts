/**
 * The light half of the tiled section change. The new page arrives as square
 * slabs, windows cut by the paint worklet in public/worklets/tile-wipe.js,
 * spreading out from where the change started. This canvas draws the same
 * slabs as beveled metal over that real content: a tint while they fly, rim
 * shading, and an area light sweeping outward in the new section's color.
 *
 * Decorative: the canvas is aria-hidden, takes no pointer events, and is blank
 * outside a transition.
 */
export const TILE_SIZE = 50

export type Rgb = [number, number, number]

/** The grid the slabs live on, in CSS px of the viewport. */
export interface TileField {
  width: number
  height: number
  tile: number
  /** Where the change started; slabs spread out from here. */
  originX: number
  originY: number
}

// Tile timing. Mirrors public/worklets/tile-wipe.js; keep the two in sync.
const SPREAD = 0.15
const FLIP = 0.2
const FLIP_MAX = FLIP * 1.3
/** Share of a tile's run spent flying in; the rest it rests and fades out. */
const LAND = 0.2

function hash(x: number, y: number, z: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function reach({ width, height, originX: x, originY: y }: TileField) {
  return Math.max(Math.hypot(x, y), Math.hypot(width - x, y), Math.hypot(x, height - y), Math.hypot(width - x, height - y)) || 1
}

function tileTiming(i: number, j: number, field: TileField, farthest: number) {
  const dx = (i + 0.5) * field.tile - field.originX
  const dy = (j + 0.5) * field.tile - field.originY
  const u = Math.min(Math.hypot(dx, dy) / farthest, 1)
  const duration = FLIP * (0.7 + 0.6 * hash(i, j, 1))
  const start = (u * (1 - SPREAD) + hash(i, j, 0) * SPREAD) * (1 - FLIP_MAX)
  // Own depth per slab (share of the focal length), odd rows a step back.
  const depth = -0.8 + 1.1 * hash(i, j, 3) - (j & 1) * 0.15
  return { start, duration, depth, odd: j & 1 }
}
// End of mirrored timing.

const VERTEX = /* glsl */ `#version 300 es
in vec2 a_corner;
in vec4 a_tile; // column, row, start, duration
in vec3 a_slab; // depth, odd row, seed
uniform float u_progress;
uniform float u_tile;
uniform float u_focal;
uniform vec2 u_view;
out vec3 v_world;
out vec2 v_uv;
out vec2 v_tilt;
out float v_air;
out float v_fade;
out float v_seed;

const float LAND = ${LAND.toFixed(3)};

void main() {
  float local = (u_progress - a_tile.z) / a_tile.w;
  if (local <= 0.0 || local >= 1.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // resting tiles: off screen
    return;
  }
  // Flight until LAND, then the slab rests on the grid and its light fades.
  // The position mirrors tileFlight in the worklet, so the light sits exactly
  // on the window the mask cuts.
  float flight = min(local / LAND, 1.0);
  float air = pow(1.0 - flight, 3.0);
  vec2 shift = vec2(a_slab.y * 0.5 * u_tile * air, 0.0);
  vec3 world = vec3((a_tile.xy + a_corner) * u_tile + shift, a_slab.x * u_focal * air);
  vec2 screen = u_view * 0.5 + (world.xy - u_view * 0.5) * (u_focal / (u_focal - world.z));
  vec2 clip = screen / u_view * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);

  // A slight lean per slab, in the lighting only (the window stays square),
  // so no two slabs catch the light the same way.
  vec2 tilt = (fract(a_slab.z * vec2(13.7, 29.3)) - 0.5) * 0.35;

  v_world = world;
  v_uv = a_corner;
  v_tilt = tilt * (0.3 + 0.7 * air);
  v_air = air;
  v_fade = smoothstep(0.0, 0.25, flight) * (1.0 - smoothstep(LAND, 1.0, local));
  v_seed = a_slab.z;
}`

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;
in vec3 v_world;
in vec2 v_uv;
in vec2 v_tilt;
in float v_air;
in float v_fade;
in float v_seed;
uniform vec3 u_to;
uniform vec3 u_light;
uniform vec2 u_view;
uniform vec2 u_origin;
uniform float u_reach;
uniform float u_focal;
uniform float u_progress;
out vec4 color;

vec3 rotateX(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);
}
vec3 rotateY(vec3 p, float a) {
  float c = cos(a), s = sin(a);
  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

void main() {
  // Bevel: the normal leans outward over the slab's rim (y points down).
  float bevel = 0.005;
  vec2 low = 1.0 - smoothstep(0.0, bevel, v_uv);
  vec2 high = 1.0 - smoothstep(0.0, bevel, 1.0 - v_uv);
  float rim = max(max(low.x, low.y), max(high.x, high.y));
  vec3 n = normalize(vec3((high - low) * 0.9, 1.0));
  n = rotateY(rotateX(n, v_tilt.x), v_tilt.y);

  vec3 view = normalize(vec3(u_view * 0.5, u_focal) - v_world);
  vec3 bounce = reflect(-view, n);

  // Area light: a ring sweeping outward from the origin with the reveal.
  // Where a slab catches it depends on its reflection, so leaning slabs and
  // bevels catch it early or late.
  vec2 outward = v_world.xy - u_origin;
  float along = length(outward) / u_reach + dot(bounce.xy, normalize(outward + 1e-4)) * 0.3;
  float offset = along - (u_progress * 1.6 - 0.2);
  float sweep = exp(-pow(offset / 0.06, 2.0)) + 0.3 * exp(-pow(offset / 0.2, 2.0));

  // Key: a point light high in front, for sparks and shade on the bevels.
  vec3 key = normalize(vec3(u_view * vec2(0.5, -0.3), u_focal * 0.8) - v_world);
  float glint = step(0.82, v_seed);
  float specular = pow(max(dot(n, normalize(key + view)), 0.0), mix(70.0, 200.0, glint)) * (1.0 + glint * 1.5);
  float shadow = rim * (1.0 - max(dot(n, key), 0.0)) * 0.6;

  // Over the real page, back to front: a stage-colored film while the slab
  // flies (darker when far, clear once landed), rim shade, then the light in
  // the section's color, its sharpest sparks whitening.
  float far = clamp(-v_world.z / u_focal, 0.0, 1.0);
  float film = 0.45 * v_air;
  vec4 c = vec4(u_to * (1.0 - 0.5 * far) * film, film);
  c = vec4(c.rgb * (1.0 - shadow), c.a + shadow * (1.0 - c.a));
  float lit = clamp(sweep * (0.55 + 0.45 * rim) + specular * (0.4 + 0.6 * rim), 0.0, 1.0);
  vec3 glow = mix(u_light, vec3(1.0), 0.3 * min(specular, 1.0));
  c = vec4(glow * lit + c.rgb * (1.0 - lit), lit + c.a * (1.0 - lit));
  // Premultiplied.
  color = c * v_fade;
}`

export interface TileFlipRun {
  field: TileField
  /** The new stage color, or null while the new section isn't applied yet. */
  stage: () => Rgb | null
  /** The light's color: the new section's own. */
  light: Rgb
  /** Linear progress of the CSS mask animation, or null once it's gone. */
  progress: () => number | null
  done: Promise<unknown>
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  return shader
}

/** Null when WebGL2 isn't available; callers keep the plain wipe then. */
export function createTileFlip(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { antialias: true, premultipliedAlpha: true, depth: false })
  if (!gl) return null

  let program: WebGLProgram
  try {
    program = gl.createProgram()!
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  } catch {
    return null
  }

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const u = {
    progress: uniform('u_progress'),
    tile: uniform('u_tile'),
    focal: uniform('u_focal'),
    view: uniform('u_view'),
    origin: uniform('u_origin'),
    reach: uniform('u_reach'),
    to: uniform('u_to'),
    light: uniform('u_light'),
  }

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
  const corner = gl.getAttribLocation(program, 'a_corner')
  gl.enableVertexAttribArray(corner)
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0)

  const STRIDE = 7 * 4
  const instances = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, instances)
  const tileAttr = gl.getAttribLocation(program, 'a_tile')
  const slabAttr = gl.getAttribLocation(program, 'a_slab')
  gl.enableVertexAttribArray(tileAttr)
  gl.vertexAttribPointer(tileAttr, 4, gl.FLOAT, false, STRIDE, 0)
  gl.vertexAttribDivisor(tileAttr, 1)
  gl.enableVertexAttribArray(slabAttr)
  gl.vertexAttribPointer(slabAttr, 3, gl.FLOAT, false, STRIDE, 16)
  gl.vertexAttribDivisor(slabAttr, 1)

  let frame = 0

  function stop() {
    cancelAnimationFrame(frame)
    frame = 0
    gl!.clearColor(0, 0, 0, 0)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    // Free the drawing buffer between transitions.
    canvas.width = canvas.height = 1
  }

  function play({ field, stage, light, progress, done }: TileFlipRun) {
    stop()
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(field.width * ratio)
    canvas.height = Math.round(field.height * ratio)

    const farthest = reach(field)
    const cols = Math.ceil(field.width / field.tile)
    const rows = Math.ceil(field.height / field.tile)
    const data = new Float32Array(cols * rows * 7)
    let k = 0
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const { start, duration, depth, odd } = tileTiming(i, j, field, farthest)
        data.set([i, j, start, duration, depth, odd, hash(i, j, 2)], k)
        k += 7
      }
    }

    gl!.useProgram(program)
    gl!.bindVertexArray(vao)
    gl!.bindBuffer(gl!.ARRAY_BUFFER, instances)
    gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.enable(gl!.BLEND)
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA)
    gl!.uniform1f(u.tile, field.tile)
    gl!.uniform1f(u.focal, Math.max(field.width, field.height) * 1.2)
    gl!.uniform2f(u.view, field.width, field.height)
    gl!.uniform2f(u.origin, field.originX, field.originY)
    gl!.uniform1f(u.reach, farthest)
    gl!.uniform3fv(u.light, light)

    const draw = () => {
      const p = progress()
      if (p === null) return stop()
      gl!.clearColor(0, 0, 0, 0)
      gl!.clear(gl!.COLOR_BUFFER_BIT)
      const color = stage()
      if (color) {
        gl!.uniform3fv(u.to, color)
        gl!.uniform1f(u.progress, p)
        gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, cols * rows)
      }
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    done.finally(stop)
  }

  return { play }
}

export type TileFlip = NonNullable<ReturnType<typeof createTileFlip>>

/** Any CSS color as 0..1 sRGB, through a 1×1 canvas. */
export function readColor(css: string): Rgb {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}
