import { CoachExperience } from "@/components/coach-experience";

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Spanish Coach home">
          <span>¡Qué chévere!</span>
          <small>Spanish Coach</small>
        </a>
        <div className="level-chip"><span>ES</span> A1 <i /> <span>EN</span> B1</div>
      </header>

      <div className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">Your next useful step</span>
          <h1>Start speaking from the first lesson.</h1>
          <p>
            A calm introduction to useful Spain Spanish, with clear English support when you need it.
          </p>
          <ul className="lesson-meta" aria-label="Lesson details">
            <li>5–30 minutes</li>
            <li>Introductions</li>
            <li>3 objectives</li>
          </ul>
        </div>
        <aside className="coach-note">
          <span className="coach-mark">C</span>
          <p><strong>Today’s goal</strong>Say your name and where you are from.</p>
        </aside>
      </div>

      <CoachExperience />
    </main>
  );
}
