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

      traceBlob(ctx, cx, cy, base + 3, amplitude * 1.08, phase);
      const membrane = ctx.createLinearGradient(cx - base, cy - base, cx + base, cy + base);
      membrane.addColorStop(0, `rgba(239,250,253,${.66 + mix * .3})`);
      membrane.addColorStop(.24, `rgba(76,128,151,${.38 + mix * .24})`);
      membrane.addColorStop(.54, `rgba(10,38,56,${.52 - mix * .14})`);
      membrane.addColorStop(.76, `rgba(118,178,203,${.48 + mix * .34})`);
      membrane.addColorStop(1, `rgba(249,253,255,${.76 + mix * .22})`);
      ctx.fillStyle = membrane;
      ctx.shadowColor = `rgba(191,229,242,${.2 + mix * .48})`;
      ctx.shadowBlur = 10 + mix * 16;
      ctx.fill();

      traceBlob(ctx, cx, cy, base - 7.5, amplitude * .58, -phase * .94, 1.35);
      const body = ctx.createRadialGradient(cx - base * .38, cy - base * .42, base * .02, cx, cy, base * 1.02);
      body.addColorStop(0, `rgba(255,255,255,${.08 + mix * .9})`);
      body.addColorStop(.21, `rgba(${180 + mix * 69},${215 + mix * 36},${230 + mix * 23},${.08 + mix * .78})`);
      body.addColorStop(.59, `rgba(${13 + mix * 214},${45 + mix * 194},${64 + mix * 183},${.46 + mix * .43})`);
      body.addColorStop(.84, `rgba(${42 + mix * 173},${91 + mix * 144},${114 + mix * 128},${.52 + mix * .38})`);
      body.addColorStop(1, `rgba(205,235,246,${.7 + mix * .25})`);
      ctx.fillStyle = body;
      ctx.shadowBlur = 0;
      ctx.fill();

      for (let i = 0; i < 5; i += 1) {
        const angle = phase * (.38 + i * .035) + i * 1.34;
        const distance = base * (.68 + (i % 2) * .08);
        const x = cx + Math.cos(angle) * distance;
        const y = cy + Math.sin(angle) * distance;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        ctx.scale(1.8 + mix * .55, .65 + (i % 3) * .15);
        ctx.beginPath();
        ctx.arc(0, 0, 4.8 + mix * 2.6, 0, TAU);
        ctx.fillStyle = `rgba(248,253,255,${.22 + mix * .4 + (i === 0 ? .18 : 0)})`;
        ctx.shadowColor = 'rgba(229,248,253,.76)';
        ctx.shadowBlur = 5 + mix * 7;
        ctx.fill();
        ctx.restore();
      }

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
