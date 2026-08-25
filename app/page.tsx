'use client';

import { useEffect, useRef } from 'react';

type Ripple = { x: number; y: number; born: number; power: number };
type AddRipple = (event: React.PointerEvent<HTMLElement>, power?: number) => void;

function RippleCanvas({ registerRef }: { registerRef: React.MutableRefObject<AddRipple | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ripples = useRef<Ripple[]>([]);
  const last = useRef({ x: -100, y: -100, time: 0 });

  useEffect(() => {
    registerRef.current = (event, power = 1) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const now = performance.now();
      const distance = Math.hypot(x - last.current.x, y - last.current.y);
      if (power > 1 || (distance > 42 && now - last.current.time > 70)) {
        ripples.current.push({ x, y, born: now, power });
        last.current = { x, y, time: now };
      }
    };
    return () => { registerRef.current = null; };
  }, [registerRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const ambient = context.createRadialGradient(width * .7, height * .43, 0, width * .7, height * .43, Math.max(width, height) * .5);
      ambient.addColorStop(0, 'rgba(93, 176, 163, 0.12)');
      ambient.addColorStop(.45, 'rgba(49, 112, 103, 0.035)');
      ambient.addColorStop(1, 'rgba(5, 12, 11, 0)');
      context.fillStyle = ambient;
      context.fillRect(0, 0, width, height);

      if (!reduceMotion) {
        ripples.current = ripples.current.filter((ripple) => {
          const age = (time - ripple.born) / 4200;
          if (age >= 1) return false;
          const radius = (32 + (1 - Math.pow(1 - age, 3)) * 410) * ripple.power;
          const opacity = Math.pow(1 - age, 1.7) * .3;
          for (let ring = 0; ring < 2; ring += 1) {
            context.beginPath();
            context.arc(ripple.x, ripple.y, Math.max(0, radius - ring * 17), 0, Math.PI * 2);
            context.strokeStyle = `rgba(205, 235, 229, ${opacity / (ring + 1)})`;
            context.lineWidth = ring === 0 ? 1.05 : .5;
            context.stroke();
          }
          return true;
        });
      }
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="water-canvas" aria-hidden="true" />;
}

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const addRipple = useRef<AddRipple | null>(null);

  return (
    <main className="site-shell">
      <section
        className="hero"
        id="top"
        onPointerMove={(event) => addRipple.current?.(event)}
        onPointerDown={(event) => addRipple.current?.(event, 1.35)}
      >
        <RippleCanvas registerRef={addRipple} />
        <div className="grain" aria-hidden="true" />

        <nav className="nav wrap" aria-label="主导航">
          <a className="brand" href="#top" aria-label="ECHOMERE 洄映首页">
            <span className="brand-mark" aria-hidden="true"><i /><i /></span>
            <span>ECHOMERE</span><em>洄映</em>
          </a>
          <div className="nav-links">
            <a href="#systems">双体系</a><a href="#method">解读方式</a><a href="#privacy">隐私与依据</a>
          </div>
          <a className="nav-cta" href="#begin">进入洄映 <Arrow /></a>
        </nav>

        <div className="hero-content wrap">
          <div className="hero-copy">
            <p className="eyebrow"><span /> ECHO · WATER · MIRROR</p>
            <p className="chinese-name">洄映</p>
            <h1>一念成漪，<br />照见未见。</h1>
            <p className="lede">以八字与星盘为双重映照，于时间的回响中，<br className="desktop-break" />辨认此刻的自己与前行的纹理。</p>
            <div className="hero-actions" id="begin">
              <a className="primary-button" href="#method">开始一次映照 <Arrow /></a>
              <a className="text-link" href="#systems">先了解洄映如何解读 <span>↓</span></a>
            </div>
          </div>

          <div className="mirror-stage" aria-label="八字与星盘双体系映照示意">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" />
            <div className="mirror-disc">
              <div className="disc-glow" />
              <span className="disc-label top">ECHO</span><span className="disc-label left">BAZI</span><span className="disc-label right">ASTRAL</span>
              <div className="disc-center"><span>洄</span><i /><small>REFLECTION 01</small></div>
            </div>
            <p className="coordinate north">23° 08′</p><p className="coordinate south">TIME · SELF · CONTEXT</p>
          </div>
        </div>

        <div className="trust-rail wrap"><span>确定性排盘</span><i /><span>双体系映照</span><i /><span>依据可追溯</span><i /><span>默认私密</span></div>
      </section>

      <section className="systems wrap" id="systems">
        <div className="section-heading">
          <p className="eyebrow"><span /> TWO SYSTEMS · ONE REFLECTION</p>
          <h2>两种时空，<br />一面镜。</h2>
          <p>不是把象征写成答案，而是让不同体系彼此映照，保留共识、分歧与未知。</p>
        </div>
        <div className="system-grid">
          <article className="system-card">
            <div className="card-index">01</div><p className="card-kicker">BĀZÌ · 八字</p><h3>时间留下的纹理</h3>
            <p>从出生时刻与节律出发，观察性格结构、人生阶段与当下周期。</p>
            <div className="card-symbol symbol-bazi" aria-hidden="true"><span>甲</span><span>子</span></div>
          </article>
          <article className="system-card">
            <div className="card-index">02</div><p className="card-kicker">ASTRAL · 星盘</p><h3>星体投下的坐标</h3>
            <p>从行星、宫位与相位关系出发，理解内在动力、关系模式与变化张力。</p>
            <div className="card-symbol symbol-astral" aria-hidden="true"><span /><i /><b /></div>
          </article>
          <article className="system-card">
            <div className="card-index">03</div><p className="card-kicker">ECHO · 洄映</p><h3>回响之后的自己</h3>
            <p>区分事实、解释与建议，让每一次解读都能追问、回看，也能被修正。</p>
            <div className="card-symbol symbol-echo" aria-hidden="true"><span /><span /><span /></div>
          </article>
        </div>
      </section>

      <section className="method" id="method">
        <div className="wrap method-inner">
          <div><p className="eyebrow"><span /> THE METHOD</p><h2>所见有源，<br />所言有度。</h2></div>
          <ol>
            <li><span>01</span><div><strong>建立出生档案</strong><p>时间、地点与精度被明确记录，不以默认值替代未知。</p></div></li>
            <li><span>02</span><div><strong>生成确定性命盘</strong><p>盘面由可复现规则计算，AI 不凭记忆自行排盘。</p></div></li>
            <li><span>03</span><div><strong>双体系解释</strong><p>分别呈现八字与星盘视角，再标明共识、分歧和限制。</p></div></li>
            <li><span>04</span><div><strong>回到现实选择</strong><p>不替你决定，只照亮可以观察、验证与行动的部分。</p></div></li>
          </ol>
        </div>
      </section>

      <section className="privacy wrap" id="privacy">
        <p className="eyebrow"><span /> PRIVATE BY DEFAULT</p>
        <div className="privacy-copy"><h2>倒影属于水面，<br />解读属于你。</h2><p>出生资料、提问与报告默认私密。分享前主动脱敏；资料变化后，旧报告保留依据并明确标记。</p></div>
        <a className="outline-button" href="#top">回到水面 ↑</a>
      </section>

      <footer><div className="wrap footer-inner"><div className="footer-brand">ECHOMERE <span>洄映</span></div><p>自我探索，而非命运裁决。</p><p>© 2026 ECHOMERE</p></div></footer>
    </main>
  );
}
