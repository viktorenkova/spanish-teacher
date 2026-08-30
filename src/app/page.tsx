import { CoachExperience } from "@/components/coach-experience";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Spanish Coach home">
          <span className="brand-mark" aria-hidden="true">¡</span>
          <span className="brand-name">Hola<span>.</span></span>
          <small>Spanish coach</small>
        </a>
        <div className="level-chip" aria-label="Spanish level A1, English support B1">
          <span>ES</span> A1 <i /> <span>EN</span> B1
        </div>
      </header>

      <div className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">Spanish, one useful step at a time</span>
          <h1>Learn Spanish that feels good to use.</h1>
          <p>
            Short, calm practice for real conversations — with clear English support whenever you need it.
          </p>
          <ul className="lesson-meta" aria-label="Lesson details">
            <li><span aria-hidden="true">◷</span> 5–30 minutes</li>
            <li><span aria-hidden="true">✦</span> Spain Spanish</li>
            <li><span aria-hidden="true">◌</span> Speak from day one</li>
          </ul>
        </div>
        <aside className="coach-note" aria-label="Today’s practice preview">
          <div className="sun" aria-hidden="true">☼</div>
          <div className="speech-bubble" lang="es">¡Hola!</div>
          <div className="cactus" aria-hidden="true"><i /><i /><i /></div>
          <p><strong>Today’s goal</strong>Say your name and where you are from.</p>
        </aside>
      </div>

      <CoachExperience />
    </main>
  );
}
