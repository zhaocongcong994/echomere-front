'use client';

import { useEffect, useRef } from 'react';

const TAU = Math.PI * 2;

const traceBlob = (ctx, cx, cy, radius, amplitude, phase, offset = 0) => {
  const points = 112;
  ctx.beginPath();
  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * TAU;
    const ripple =
      Math.sin(angle * 3 + phase + offset) * .48 +
      Math.sin(angle * 5 - phase * .72 + offset * 1.7) * .3 +
      Math.sin(angle * 8 + phase * 1.18 - offset) * .22;
    const r = radius + ripple * amplitude;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
};

export default function WaterOrbCanvas({ hovered, active }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ hovered, active });
  const hoverMixRef = useRef(0);

  useEffect(() => {
    stateRef.current = { hovered, active };
  }, [hovered, active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const draw = now => {
      const target = stateRef.current.hovered ? 1 : 0;
      hoverMixRef.current += (target - hoverMixRef.current) * .075;
      const mix = hoverMixRef.current;
      const activeMix = stateRef.current.active ? 1 : 0;
      const time = reduceMotion ? 0 : now * .001;
      const phase = time * (.52 + mix * 1.15 + activeMix * .16);
      const cx = width / 2;
      const cy = height / 2;
      const base = Math.min(width, height) * (.34 + mix * .012);
      const amplitude = 4.2 + mix * 7.3 + activeMix * 1.1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      traceBlob(ctx, cx, cy, base, amplitude, phase);
      const body = ctx.createRadialGradient(cx - base * .34, cy - base * .38, base * .04, cx, cy, base * 1.12);
      body.addColorStop(0, `rgba(255,255,255,${.08 + mix * .84})`);
      body.addColorStop(.22, `rgba(${190 + mix * 52},${220 + mix * 28},${234 + mix * 18},${.08 + mix * .72})`);
      body.addColorStop(.62, `rgba(${22 + mix * 190},${58 + mix * 170},${78 + mix * 164},${.22 + mix * .57})`);
      body.addColorStop(.86, `rgba(${112 + mix * 90},${164 + mix * 59},${188 + mix * 48},${.3 + mix * .5})`);
      body.addColorStop(1, `rgba(229,245,250,${.42 + mix * .48})`);
      ctx.fillStyle = body;
      ctx.shadowColor = `rgba(191,229,242,${.14 + mix * .42})`;
      ctx.shadowBlur = 7 + mix * 12;
      ctx.fill();

      const edge = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
      edge.addColorStop(0, `rgba(235,249,252,${.5 + mix * .42})`);
      edge.addColorStop(.3, `rgba(91,144,169,${.28 + mix * .28})`);
      edge.addColorStop(.58, `rgba(32,80,105,${.3 - mix * .08})`);
      edge.addColorStop(1, `rgba(245,252,254,${.62 + mix * .36})`);
      ctx.strokeStyle = edge;
      ctx.lineWidth = 4.5 + mix * 3;
      ctx.shadowBlur = 8 + mix * 11;
      ctx.stroke();

      traceBlob(ctx, cx, cy, base - 7, amplitude * .62, -phase * 1.13, 1.7);
      ctx.strokeStyle = `rgba(206,235,245,${.2 + mix * .38})`;
      ctx.lineWidth = 3 + mix * 2.2;
      ctx.shadowBlur = 5 + mix * 8;
      ctx.stroke();

      ctx.setLineDash([18, 31, 7, 24]);
      ctx.lineDashOffset = -phase * 26;
      traceBlob(ctx, cx, cy, base - 1.5, amplitude * .84, phase * .9, .8);
      ctx.strokeStyle = `rgba(255,255,255,${.48 + mix * .42})`;
      ctx.lineWidth = 3.2 + mix * 2.8;
      ctx.shadowColor = 'rgba(235,250,255,.82)';
      ctx.shadowBlur = 8 + mix * 8;
      ctx.stroke();
      ctx.setLineDash([]);

      if (mix > .03) {
        ctx.shadowBlur = 5;
        for (let i = 0; i < 16; i += 1) {
          const angle = i * 2.399 + phase * .22;
          const distance = base + 11 + Math.sin(i * 1.7 + phase) * 8;
          const size = (.8 + (i % 4) * .42) * mix;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, size, 0, TAU);
          ctx.fillStyle = `rgba(220,244,251,${mix * (.3 + (i % 3) * .12)})`;
          ctx.fill();
        }
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas className="water-orb-canvas" ref={canvasRef} aria-hidden="true" />;
}
