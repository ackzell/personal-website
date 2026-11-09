/**
 * The GPU half of the tiled section change. A canvas over the new page paints
 * the old stage's color and cuts the slabs out of it: each slab is a hole onto
 * the new page beneath, flying in from its own depth (small when far, large
 * when near) and settling on the grid on a light spring. The front spreads
 * from where the change started and runs ahead in the direction of travel.
 *
 * Every slab's timing is worked out once per change; a frame is one uniform
 * and one instanced draw, so nothing is repainted on the main thread. The old
 * page's words above clear just ahead of the slabs (public/worklets/tile-wipe.js).
 *
 * Decorative: the canvas is aria-hidden and takes no pointer events.
 */

export type TileField = {
  width: number
  height: number
  tile: number
  originX: number
  originY: number
  /** 1 forward (the new page comes from the right), -1 back. */
  way: number
}

/**
 * Shares of the linear progress: SPREAD is how scattered the starts are, FLIP
 * a tile's run, LAND the part of it spent flying in. BOUNCE is the spring a
 * tile lands on. The worklet reads spread and flip to keep its clearing ahead.
 */
export const TILE_TIMING = { spread: 0.45, flip: 0.32, land: 0.7, bounce: 0.25 }

/** How much sooner the front reaches what lies in the direction of travel than what's behind (mirrored in the worklet and utils/pageArrival). */
const AHEAD = 0.7
const BEHIND = 1.3

function hash(x: number, y: number, z: number) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

function distance(x: number, y: number, field: TileField) {
  const dx = x - field.originX
  return Math.hypot(dx * (dx * field.way < 0 ? AHEAD : BEHIND), y - field.originY)
}

/** Per slab: column, row, start, duration, depth. */
function slabs(field: TileField) {
  const { spread, flip } = TILE_TIMING
  const { width, height, tile } = field
  const farthest = Math.max(distance(0, 0, field), distance(width, 0, field), distance(0, height, field), distance(width, height, field)) || 1
  const cols = Math.ceil(width / tile)
  const rows = Math.ceil(height / tile)
  const data = new Float32Array(cols * rows * 5)
  let n = 0
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const u = Math.min(distance((i + 0.5) * tile, (j + 0.5) * tile, field) / farthest, 1)
      // Scattered only as the front moves out: at the press the page opens at
      // once, so the change answers it.
      const start = (u * (1 - spread) + hash(i, j, 0) * spread * Math.min(u * 4, 1)) * (1 - flip * 1.3)
      // Own depth per slab (share of the focal length), odd rows a step back.
      data.set([i, j, start, flip * (0.7 + 0.6 * hash(i, j, 1)), -0.8 + 1.1 * hash(i, j, 3) - (j & 1) * 0.15], n)
      n += 5
    }
  }
  return data
}

const VERTEX = /* glsl */ `#version 300 es
in vec2 a_corner;
in vec4 a_tile; // column, row, start, duration
in float a_depth;
uniform float u_progress;
uniform float u_tile;
uniform float u_land;
uniform float u_bounce;
uniform vec2 u_view;
uniform bool u_shadow;
uniform float u_shade; // how dark a shadow is at most, as a share of the stage it falls on
out float v_alpha;
out vec2 v_local;
out float v_half;
out float v_blur;

// How far a slab still has to go: an underdamped spring that settles by the
// end of its flight, dipping just past the grid and back.
float air(float t) {
  if (t >= 1.0) return 0.0;
  float zeta = 1.0 - u_bounce;
  float omega = 4.6 / zeta;
  float damped = omega * sqrt(1.0 - zeta * zeta);
  return exp(-zeta * omega * t) * (cos(damped * t) + (zeta * omega / damped) * sin(damped * t));
}

void main() {
  float local = (u_progress - a_tile.z) / a_tile.w;
  if (local <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // not set off yet: off screen
    v_alpha = 0.0;
    return;
  }
  float flight = min(local / u_land, 1.0);
  float left = air(flight);
  float k = 1.0 / (1.0 - a_depth * left);
  vec2 center = (a_tile.xy + 0.5) * u_tile + vec2(mod(a_tile.y, 2.0) * 0.5 * u_tile * left, 0.0);
  center = (center - u_view * 0.5) * k + u_view * 0.5;
  // Holes open almost at once: a slow fade would show both pages through each other.
  v_alpha = smoothstep(0.0, 0.06, flight);
  vec2 p;
  if (u_shadow) {
    // Cast on the old stage, down and a little right: the higher the slab
    // still is, the farther and softer; gone as it lands.
    float h = abs(left);
    float half_ = u_tile * 0.5 * k;
    v_blur = 1.0 + 0.5 * u_tile * h * k;
    v_half = half_;
    v_local = (a_corner * 2.0 - 1.0) * (half_ + 2.0 * v_blur);
    p = center + vec2(0.15, 0.4) * u_tile * h * k + v_local;
    v_alpha *= u_shade * min(h * 4.0, 1.0);
  } else {
    // A pixel of overlap so neighboring holes leave no seams.
    p = center + (a_corner * 2.0 - 1.0) * (u_tile * 0.5 * k + 1.0);
  }
  vec2 clip = p / u_view * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}`

const FRAGMENT = /* glsl */ `#version 300 es
precision mediump float;
in float v_alpha;
in vec2 v_local;
in float v_half;
in float v_blur;
uniform bool u_shadow;
out vec4 color;
void main() {
  float a = v_alpha;
  if (u_shadow) {
    vec2 d = abs(v_local) - v_half;
    float edge = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    a *= 1.0 - smoothstep(-v_blur, v_blur, edge);
  }
  color = vec4(0.0, 0.0, 0.0, a);
}`

/** A CSS color (any syntax the browser knows) as 0..1 sRGB. */
function rgbOf(css: string): [number, number, number] {
  const ctx = document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  if (!ctx) return [0, 0, 0]
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}

export function createTileCover(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, stencil: false })
  if (!gl) return null
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }
  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const vao = gl.createVertexArray()
  gl.bindVertexArray(vao)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW)
  const corner = gl.getAttribLocation(program, 'a_corner')
  gl.enableVertexAttribArray(corner)
  gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0)

  const instances = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, instances)
  const tile = gl.getAttribLocation(program, 'a_tile')
  const depth = gl.getAttribLocation(program, 'a_depth')
  gl.enableVertexAttribArray(tile)
  gl.vertexAttribPointer(tile, 4, gl.FLOAT, false, 20, 0)
  gl.vertexAttribDivisor(tile, 1)
  gl.enableVertexAttribArray(depth)
  gl.vertexAttribPointer(depth, 1, gl.FLOAT, false, 20, 16)
  gl.vertexAttribDivisor(depth, 1)

  const uniform = (name: string) => gl.getUniformLocation(program, name)
  const u = { progress: uniform('u_progress'), tile: uniform('u_tile'), land: uniform('u_land'), bounce: uniform('u_bounce'), view: uniform('u_view'), shadow: uniform('u_shadow'), shade: uniform('u_shade') }
  gl.uniform1f(u.land, TILE_TIMING.land)
  gl.uniform1f(u.bounce, TILE_TIMING.bounce)
  gl.enable(gl.BLEND)

  let count = 0
  let stage: [number, number, number] = [0, 0, 0]
  let dimTo = 1

  return {
    /**
     * Sets up a change and draws its first frame, the whole cover: `color` is
     * the old stage, dimmed to `dim` brightness over the first 40% so the new
     * section's slabs land on it as color on a darker field. `shadow` is
     * how dark the slabs' shadows get on it at most.
     */
    prepare(field: TileField, color: string, dim: number, shadow: number) {
      // shortcut: capped at 2x; the holes are axis-aligned squares, so 3x screens lose nothing visible.
      const scale = Math.min(devicePixelRatio, 2)
      canvas.width = Math.round(field.width * scale)
      canvas.height = Math.round(field.height * scale)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(u.view, field.width, field.height)
      gl.uniform1f(u.tile, field.tile)
      const data = slabs(field)
      count = data.length / 5
      gl.bindBuffer(gl.ARRAY_BUFFER, instances)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      stage = rgbOf(color)
      dimTo = dim
      gl.uniform1f(u.shade, shadow)
      this.draw(0)
    },
    draw(progress: number) {
      const t = Math.min(progress / 0.4, 1)
      const shade = 1 + (dimTo - 1) * (1 - (1 - t) ** 3)
      gl.clearColor(stage[0] * shade, stage[1] * shade, stage[2] * shade, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(u.progress, progress)
      // Shadows darken the cover and leave it opaque; then each hole takes
      // its share out of it: dst *= 1 - alpha.
      gl.uniform1i(u.shadow, 1)
      gl.blendFuncSeparate(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
      gl.uniform1i(u.shadow, 0)
      gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count)
    },
    clear() {
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    },
  }
}
