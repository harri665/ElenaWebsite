// Noise-dissolve transition, modelled on the hero background on
// dungeonsanddragons.com: two textures, an fbm noise field, and a soft
// threshold that sweeps through the noise as progress goes 0 → 1. The UVs
// wobble slightly mid-transition. On top of their version we add optional
// blur per texture and a thin glowing edge in Elena's blue / purple / pink.

export const VERTEX = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`

export const FRAGMENT = `
precision highp float;

uniform sampler2D u_from;
uniform sampler2D u_to;
uniform vec4 u_fromXf;   // xy = uv scale, zw = uv offset (object-fit: cover)
uniform vec4 u_toXf;
uniform float u_fromBlur;
uniform float u_toBlur;
uniform float u_progress;
uniform float u_time;

varying vec2 v_uv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// 24-tap Vogel-disk blur; blur is 0..1.
vec4 sampleSoft(sampler2D tex, vec2 uv, float blur) {
  vec4 acc = texture2D(tex, uv);
  if (blur < 0.001) return acc;
  float r = blur * 0.022;
  for (int i = 0; i < 24; i++) {
    float fi = float(i) + 0.5;
    float rad = sqrt(fi / 24.0) * r;
    float ang = fi * 2.39996;
    acc += texture2D(tex, uv + vec2(cos(ang), sin(ang)) * rad);
  }
  return acc / 25.0;
}

void main() {
  float p = clamp(u_progress, 0.0, 1.0);
  vec2 uv = v_uv;

  float wobble = 1.0 - abs(1.0 - 2.0 * p);
  vec2 warp = vec2(
    fbm(uv * 6.0 + vec2(u_time * 0.00012, 0.0)),
    fbm(uv * 6.0 + vec2(0.0, u_time * 0.00011))
  ) - 0.5;
  vec2 uvw = uv + warp * wobble * 0.03;

  vec4 cFrom = sampleSoft(u_from, uvw * u_fromXf.xy + u_fromXf.zw, u_fromBlur);
  vec4 cTo = sampleSoft(u_to, uvw * u_toXf.xy + u_toXf.zw, u_toBlur);

  float n = fbm(uvw * 4.0 + vec2(u_time * 0.00008, u_time * 0.00006));
  float edge = 0.18;
  float m = 1.0 - smoothstep(p - edge, p + edge, n);
  m = clamp(m, 0.0, 1.0);
  m *= step(0.0001, p);
  m = mix(m, 1.0, step(0.9999, p));

  vec4 col = mix(cFrom, cTo, m);

  float band = pow(1.0 - abs(2.0 * m - 1.0), 2.5) * wobble;
  vec3 glow = mix(vec3(0.46, 0.66, 1.0), vec3(0.71, 0.53, 1.0), smoothstep(0.30, 0.48, n));
  glow = mix(glow, vec3(1.0, 0.53, 0.78), smoothstep(0.48, 0.66, n));
  col.rgb += glow * band * 0.5;
  col.a = clamp(col.a + band * 0.35, 0.0, 1.0);

  gl_FragColor = col;
}
`
