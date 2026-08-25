'use client';

import { useEffect, useRef } from 'react';

type RippleDistortionProps = {
  src: string;
  brushSize?: number;
  strength?: number;
  swirl?: number;
  rings?: number;
  grayscale?: boolean;
  spread?: number;
};

type Ripple = { x: number; y: number; born: number; power: number };

const MAX_RIPPLES = 12;

const vertexShader = `
  attribute vec2 a_position;
  varying vec2 v_uv;

  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  varying vec2 v_uv;
  uniform sampler2D u_image;
  uniform vec2 u_resolution;
  uniform vec2 u_imageResolution;
  uniform vec4 u_ripples[${MAX_RIPPLES}];
  uniform float u_brushSize;
  uniform float u_strength;
  uniform float u_swirl;
  uniform float u_rings;
  uniform float u_spread;
  uniform float u_grayscale;

  vec2 coverUv(vec2 uv) {
    float screenAspect = u_resolution.x / u_resolution.y;
    float imageAspect = u_imageResolution.x / u_imageResolution.y;
    vec2 scale = vec2(1.0);

    if (screenAspect > imageAspect) {
      scale.y = imageAspect / screenAspect;
    } else {
      scale.x = screenAspect / imageAspect;
    }

    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    float baseRadius = u_brushSize / u_resolution.y;
    vec2 displacement = vec2(0.0);

    for (int i = 0; i < ${MAX_RIPPLES}; i++) {
      vec4 ripple = u_ripples[i];
      float age = ripple.z;

      if (age >= 0.0 && age < 1.0) {
        vec2 delta = uv - ripple.xy;
        delta.x *= aspect;
        float distanceToOrigin = length(delta);
        vec2 radial = distanceToOrigin > 0.0001 ? delta / distanceToOrigin : vec2(0.0);
        radial.x /= aspect;
        vec2 tangent = vec2(-radial.y / aspect, radial.x * aspect);

        float eased = 1.0 - pow(1.0 - age, 2.4);
        float radius = baseRadius * (0.55 + eased * u_spread);
        float band = baseRadius * (0.8 + age * 0.9);
        float envelope = exp(-pow((distanceToOrigin - radius) / max(band, 0.0001), 2.0) * 2.8);
        float phase = (distanceToOrigin - radius) / max(baseRadius, 0.0001);
        float wave = sin(phase * u_rings * 6.2831853 - age * 4.2);
        float fade = pow(1.0 - age, 1.55) * ripple.w;

        displacement += (radial * wave + tangent * wave * u_swirl * 0.28)
          * envelope * fade * u_strength * 0.16;
      }
    }

    vec2 sampleUv = coverUv(clamp(uv + displacement, 0.001, 0.999));
    vec4 color = texture2D(u_image, sampleUv);
    float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    color.rgb = mix(color.rgb, vec3(gray), u_grayscale);
    gl_FragColor = color;
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export default function RippleDistortion({
  src,
  brushSize = 65,
  strength = 0.105,
  swirl = 1,
  rings = 2.5,
  grayscale = false,
  spread = 5.75,
}: RippleDistortionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripplesRef = useRef<Ripple[]>([]);
  const lastPoint = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
    if (!vertex || !fragment) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const resolutionUniform = gl.getUniformLocation(program, 'u_resolution');
    const imageResolutionUniform = gl.getUniformLocation(program, 'u_imageResolution');
    const ripplesUniform = gl.getUniformLocation(program, 'u_ripples[0]');
    const brushUniform = gl.getUniformLocation(program, 'u_brushSize');
    const strengthUniform = gl.getUniformLocation(program, 'u_strength');
    const swirlUniform = gl.getUniformLocation(program, 'u_swirl');
    const ringsUniform = gl.getUniformLocation(program, 'u_rings');
    const spreadUniform = gl.getUniformLocation(program, 'u_spread');
    const grayscaleUniform = gl.getUniformLocation(program, 'u_grayscale');

    const image = new Image();
    image.decoding = 'async';
    image.src = src;

    let animationFrame = 0;
    let imageReady = false;
    let pixelRatio = 1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rippleData = new Float32Array(MAX_RIPPLES * 4);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const render = (now: number) => {
      resize();
      if (imageReady) {
        rippleData.fill(-1);
        ripplesRef.current = ripplesRef.current.filter((ripple) => now - ripple.born < 3000);
        ripplesRef.current.slice(-MAX_RIPPLES).forEach((ripple, index) => {
          const offset = index * 4;
          rippleData[offset] = ripple.x;
          rippleData[offset + 1] = ripple.y;
          rippleData[offset + 2] = (now - ripple.born) / 3000;
          rippleData[offset + 3] = ripple.power;
        });

        gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
        gl.uniform2f(imageResolutionUniform, image.naturalWidth, image.naturalHeight);
        gl.uniform4fv(ripplesUniform, rippleData);
        gl.uniform1f(brushUniform, brushSize * pixelRatio);
        gl.uniform1f(strengthUniform, strength);
        gl.uniform1f(swirlUniform, swirl);
        gl.uniform1f(ringsUniform, rings);
        gl.uniform1f(spreadUniform, spread);
        gl.uniform1f(grayscaleUniform, grayscale ? 1 : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      animationFrame = requestAnimationFrame(render);
    };

    image.onload = () => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      imageReady = true;
    };

    const addRipple = (event: PointerEvent, power = 1) => {
      if (reduceMotion) return;
      const rect = canvas.getBoundingClientRect();
      const xPx = event.clientX - rect.left;
      const yPx = event.clientY - rect.top;
      const distance = Math.hypot(xPx - lastPoint.current.x, yPx - lastPoint.current.y);
      if (distance < 15 && power === 1) return;

      ripplesRef.current.push({
        x: xPx / rect.width,
        y: 1 - yPx / rect.height,
        born: performance.now(),
        power,
      });
      ripplesRef.current = ripplesRef.current.slice(-MAX_RIPPLES);
      lastPoint.current = { x: xPx, y: yPx };
    };

    const onMove = (event: PointerEvent) => addRipple(event);
    const onDown = (event: PointerEvent) => addRipple(event, 2);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [brushSize, grayscale, rings, spread, src, strength, swirl]);

  return (
    <div className="ripple-background" style={{ backgroundImage: `url(${src})` }} aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
