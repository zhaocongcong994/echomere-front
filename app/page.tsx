'use client';

import { useState } from 'react';
import RippleDistortion from './RippleDistortion';

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const [variant, setVariant] = useState<'a' | 'b'>('a');

  const actions = variant === 'a'
    ? ['照见此刻', '听见回响']
    : ['进入映照', '循光而行'];

  return (
    <main className={`hero-shell variant-${variant}`}>
      <RippleDistortion
        src="/hero-v2.png"
        brushSize={97.5}
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
        <div className="variant-switch" aria-label="首页配色版本">
          <button className={variant === 'a' ? 'active' : ''} onClick={() => setVariant('a')}>
            A <span>暮紫 · 古金</span>
          </button>
          <button className={variant === 'b' ? 'active' : ''} onClick={() => setVariant('b')}>
            B <span>暗绯 · 雾蓝</span>
          </button>
        </div>
        <a className="enter-link" href="#begin">
          进入洄映 <Arrow />
        </a>
      </nav>

      <section className="hero-content" id="top">
        <div className="hero-copy" id="begin">
          <p className="kicker">ECHO · WATER · MIRROR</p>
          <h1><span>一念成漪</span><span>照见未见</span></h1>
          <p className="intro">
            以八字与星盘为双重映照，<br />
            于时间的回响中，辨认此刻的自己。
          </p>
        </div>

        <div className="orb-actions" aria-label={`版本 ${variant.toUpperCase()} 入口文案`}>
          <a className="action-orb orb-one" href="#begin"><span>{actions[0]}</span></a>
          <a className="action-orb orb-two" href="#begin"><span>{actions[1]}</span></a>
        </div>
      </section>

      <div className="surface-note" aria-hidden="true">
        <span>MOVE TO DISTURB THE SURFACE</span>
        <i />
        <span>23° 08′</span>
      </div>
    </main>
  );
}
