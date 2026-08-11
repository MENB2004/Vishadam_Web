// VISHADAM — About Page

import Reveal from '../components/Reveal';

export default function About() {
  return (
    <div className="about">
      <div className="about-header">
        <h1 className="about-title">
          About <span className="text-gradient glitch-text" data-text="VISHADAM">VISHADAM</span>
        </h1>
        <p className="about-tagline">"Come in a mood, leave worse."</p>
      </div>

      <Reveal delay={100}>
        <div className="about-section">
          <h2>What is this?</h2>
        <p>
          <strong>VISHADAM</strong> (വിഷാദം — meaning "sadness" in Malayalam) is a satirical
          web platform for when you're already in a bad mood and just want someone to
          make it hilariously worse.
        </p>
        <p>
          Type what went wrong. We'll detect your language (English or Malayalam),
          figure out your pain point, and serve you a personalized demotivation line
          that hits right where it hurts — in the funniest way possible.
        </p>
        <p>
          Zero encouragement. Zero positivity. 100% satirical misery.
        </p>
        </div>
      </Reveal>

      <Reveal delay={200}>
        <div className="about-section">
          <h2>How it works</h2>
        <p>
          1. You type your problem (in English, Malayalam, or both) <br />
          2. Our engine detects the language and extracts the key issue <br />
          3. We match it to a "pain bucket" (exam failure, breakup, work stress, etc.) <br />
          4. You get a personalized demotivation line. You're welcome.
        </p>
        </div>
      </Reveal>

      <Reveal delay={300}>
        <div className="about-section">
          <h2>Our Promise</h2>
        <div className="about-guardrail">
          <p>
            <strong>We promise to be mean, not cruel.</strong>
          </p>
          <p>
            VISHADAM is satire — we mock situations, not people's worth. If you're
            going through something genuinely serious (self-harm, abuse, crisis),
            we won't joke about it. Instead, we'll show you a kind message and
            real helpline numbers.
          </p>
          <p>
            <strong>Helplines (India):</strong><br />
            📞 iCall: 9152987821<br />
            📞 Vandrevala Foundation: 1860-2662-345<br />
            📞 KIRAN: 1800-599-0019 (toll-free, 24/7)
          </p>
        </div>
        </div>
      </Reveal>

      <Reveal delay={400}>
        <div className="about-section">
          <h2>Built With</h2>
        <div className="about-tech">
          <div className="about-tech-item">
            <strong>React</strong>
            UI Framework
          </div>
          <div className="about-tech-item">
            <strong>TypeScript</strong>
            Type Safety
          </div>
          <div className="about-tech-item">
            <strong>Vite</strong>
            Build Tool
          </div>
          <div className="about-tech-item">
            <strong>Supabase</strong>
            Backend
          </div>
          <div className="about-tech-item">
            <strong>NLP Engine</strong>
            Rule-based
          </div>
          <div className="about-tech-item">
            <strong>Noto Sans</strong>
            Malayalam Font
          </div>
        </div>
        </div>
      </Reveal>

      <Reveal delay={500}>
        <div className="about-section">
          <h2>The Name</h2>
        <p>
          <strong>വിഷാദം</strong> (VISHADAM) means "sadness" or "melancholy" in Malayalam.
          We also considered: <em>Nirash (നിരാശ)</em> = despair,
          <em> MoodKiller</em>, and <em>Mosham (മോശം)</em> = bad.
          We went with VISHADAM because it sounds dramatic. Like your problems.
        </p>
        </div>
      </Reveal>
    </div>
  );
}
