import { VERTEX, FRAGMENT } from './shaders.js'

const DURATION = 1400
const INITIAL_DURATION = 6000
const MAX_CANVAS_WIDTH = 1800

const smoothstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t))

// uv transform that makes a texture behave like `object-fit: cover`,
// anchored at a focal point (0..1, measured from the top-left).
function coverTransform(cw, ch, iw, ih, fx = 0.5, fy = 0.32) {
  if (!cw || !ch || !iw || !ih) return [1, 1, 0, 0]
  const canvasAspect = cw / ch
  const imageAspect = iw / ih
  let sx = 1
  let sy = 1
  if (canvasAspect > imageAspect) sy = imageAspect / canvasAspect
  else sx = canvasAspect / imageAspect
  // Textures are uploaded flipped, so v = 1 is the top of the image.
  return [sx, sy, fx * (1 - sx), (1 - sy) * (1 - fy)]
}

function compile(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Owns the WebGL context behind the full-screen backdrop. Call `show(desc)`
 * whenever the backdrop should change; it loads the image and dissolves to it.
 * Returns null when WebGL isn't available.
 */
export function createBackdropRenderer(canvas, { reducedMotion = false } = {}) {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false })
  if (!gl) return null

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX)
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT)
  if (!vs || !fs) return null
  const program = gl.createProgram()
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'a_pos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {}
  for (const name of ['u_from', 'u_to', 'u_fromXf', 'u_toXf', 'u_fromBlur', 'u_toBlur', 'u_progress', 'u_time']) {
    u[name] = gl.getUniformLocation(program, name)
  }
  gl.uniform1i(u.u_from, 0)
  gl.uniform1i(u.u_to, 1)

  const makeTexture = () => {
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
    return tex
  }

  // A "layer" is what one side of the dissolve shows.
  const empty = { tex: makeTexture(), w: 1, h: 1, blur: 0, focus: [0.5, 0.5], canvasSpace: false, key: '' }
  // Holds a frame grabbed mid-transition so a new target can dissolve from exactly what's on screen.
  const snapshotTex = makeTexture()

  const textures = new Map() // src -> Promise<{ tex, w, h }>
  const loadTexture = (src) => {
    if (!textures.has(src)) {
      textures.set(
        src,
        new Promise((resolve, reject) => {
          const img = new Image()
          img.decoding = 'async'
          img.onload = () => {
            const tex = makeTexture()
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
            gl.bindTexture(gl.TEXTURE_2D, tex)
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
            resolve({ tex, w: img.naturalWidth, h: img.naturalHeight })
          }
          img.onerror = reject
          img.src = src
        }),
      )
    }
    return textures.get(src)
  }

  const state = { from: empty, to: empty, start: 0, running: false, duration: DURATION }
  const t0 = performance.now()
  let frame = 0
  let latestRequest = 0
  let destroyed = false
  let hasShown = false

  const progressAt = (now) => {
    if (!state.running) return 1
    return smoothstep((now - state.start) / (reducedMotion ? 1 : state.duration))
  }

  const layerTransform = (layer) =>
    layer.canvasSpace
      ? [1, 1, 0, 0]
      : coverTransform(canvas.width, canvas.height, layer.w, layer.h, layer.focus[0], layer.focus[1])

  const draw = (now) => {
    const p = progressAt(now)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, state.from.tex)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, state.to.tex)
    gl.uniform4fv(u.u_fromXf, layerTransform(state.from))
    gl.uniform4fv(u.u_toXf, layerTransform(state.to))
    gl.uniform1f(u.u_fromBlur, state.from.blur)
    gl.uniform1f(u.u_toBlur, state.to.blur)
    gl.uniform1f(u.u_progress, p)
    gl.uniform1f(u.u_time, now - t0)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    return p
  }

  const tick = (now) => {
    frame = 0
    if (destroyed) return
    const p = draw(now)
    if (state.running && p >= 1) {
      state.running = false
      state.from = state.to
      draw(now)
    }
    if (state.running) frame = requestAnimationFrame(tick)
  }

  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame(tick)
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = Math.max(1, Math.round(rect.width * dpr))
    let h = Math.max(1, Math.round(rect.height * dpr))
    if (w > MAX_CANVAS_WIDTH) {
      h = Math.round((h * MAX_CANVAS_WIDTH) / w)
      w = MAX_CANVAS_WIDTH
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      // Resizing clears the drawing buffer immediately; redraw synchronously so
      // there's no gap where the canvas is blank (Safari resizes this a lot
      // mid-scroll as its dynamic toolbar collapses/expands).
      draw(performance.now())
    }
    requestDraw()
  }

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvas)
  resize()

  async function show(desc) {
    const request = ++latestRequest
    const key = desc ? `${desc.src}|${desc.blur ?? 0}` : ''
    if (key === state.to.key) return

    let layer = empty
    if (desc?.src) {
      try {
        const loaded = await loadTexture(desc.src)
        layer = { ...loaded, blur: desc.blur ?? 0, focus: desc.focus ?? [0.5, 0.2], canvasSpace: false, key }
      } catch {
        return
      }
    }
    // A newer request came in while this image was loading.
    if (destroyed || request !== latestRequest || key === state.to.key) return

    const now = performance.now()
    if (state.running) {
      // Freeze the current mid-dissolve frame and dissolve onward from it.
      draw(now)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, snapshotTex)
      gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, canvas.width, canvas.height, 0)
      state.from = { tex: snapshotTex, w: canvas.width, h: canvas.height, blur: 0, focus: [0.5, 0.5], canvasSpace: true, key: '' }
    } else {
      state.from = state.to
    }
    state.to = layer
    state.start = now
    state.running = true
    state.duration = hasShown ? DURATION : INITIAL_DURATION
    hasShown = true
    requestDraw()
  }

  // Warm the cache so later transitions start instantly.
  const preload = (srcs) => srcs.forEach((src) => loadTexture(src).catch(() => {}))

  function destroy() {
    destroyed = true
    cancelAnimationFrame(frame)
    resizeObserver.disconnect()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }

  return { show, preload, destroy }
}
