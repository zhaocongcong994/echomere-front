'use client';

import RippleDistortion from './RippleDistortion';

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  return (
    <main className="hero-shell">
      <RippleDistortion
        src="/hero.jpg"
        brushSize={65}
        strength={0.105}
        swirl={1}
        rings={2.5}
        grayscale
        spread={5.75}
      />

      <div className="hero-vignette" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />

      <nav className="site-nav" aria-label="主导航">
        <a className="wordmark" href="#top" aria-label="ECHOMERE 洄映首页">
          <span>ECHOMERE</span>
          <em>洄映</em>
        </a>
        <div className="nav-axis" aria-hidden="true">
          <span>REFLECTION</span>
          <i />
          <span>01</span>
        </div>
        <a className="enter-link" href="#begin">
          进入洄映 <Arrow />
        </a>
      </nav>

      <section className="hero-content" id="top">
        <div className="hero-copy" id="begin">
          <p className="kicker">ECHO · WATER · MIRROR</p>
          <h1>一念成漪，<br />照见未见。</h1>
          <p className="intro">
            以八字与星盘为双重映照，<br />
            于时间的回响中，辨认此刻的自己。
          </p>
        </div>

        <a className="primary-action" href="#begin" aria-label="开始一次映照">
          <span>开始一次映照</span>
          <Arrow />
        </a>
      </section>

      <div className="surface-note" aria-hidden="true">
        <span>MOVE TO DISTURB THE SURFACE</span>
        <i />
        <span>23° 08′</span>
      </div>
    </main>
  );
}
