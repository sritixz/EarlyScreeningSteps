import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DOMAINS = [
  { code: '01', name: 'Communication', desc: 'Words, phrases, and following instructions' },
  { code: '02', name: 'Gross motor', desc: 'Running, climbing, balance' },
  { code: '03', name: 'Fine motor', desc: 'Stacking, scribbling, small movements' },
  { code: '04', name: 'Problem solving', desc: 'Sorting, matching, cause and effect' },
  { code: '05', name: 'Personal-social', desc: 'Pretend play, sharing, routines' },
];

const STEPS = [
  {
    stage: 'Submitted',
    title: 'Answer a short questionnaire',
    desc: 'Parents answer a few plain-language questions about what their child does today, and can add a short video.',
  },
  {
    stage: 'Assigned',
    title: 'Matched to a reviewer',
    desc: 'The screening goes straight to a licensed reviewer with room on their caseload — no waiting on a scheduling system.',
  },
  {
    stage: 'In review',
    title: 'A real person looks at it',
    desc: 'Reviewers read the answers, watch the video, and check history from any past screenings for that child.',
  },
  {
    stage: 'Completed',
    title: 'Findings, in plain terms',
    desc: 'A risk level, specific observations, and recommended next steps — plus a place to ask the reviewer questions directly.',
  },
];

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="mark" />
          Early Steps
        </div>
        <div className="row">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="eyebrow">Developmental screening, ages 2–3</span>
          <h1>
            Every child deserves an early look —<br />not just the ones with easy access to a clinic.
          </h1>
          <p className="landing-lede">
            Early Steps pairs a short at-home questionnaire with review from a real,
            licensed reviewer — for families who can't get in to see a specialist,
            or don't know where to start.
          </p>
          <div className="row">
            <Link to="/signup" className="btn btn-primary">Start a screening</Link>
            <Link to="/signup" className="btn btn-ghost">Apply as a reviewer</Link>
          </div>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <svg viewBox="0 0 320 320" className="hero-steps-svg">
            {STEPS.map((_, i) => {
              const cx = 60 + i * 70;
              const cy = 260 - i * 55;
              return (
                <g key={i}>
                  {i > 0 && (
                    <line
                      x1={60 + (i - 1) * 70}
                      y1={260 - (i - 1) * 55}
                      x2={cx}
                      y2={cy}
                      stroke="var(--color-border-strong)"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
            {STEPS.map((_, i) => {
              const cx = 60 + i * 70;
              const cy = 260 - i * 55;
              const isLast = i === STEPS.length - 1;
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={isLast ? 12 : 9}
                  fill={isLast ? 'var(--color-milestone)' : 'var(--color-primary)'}
                  stroke={isLast ? 'var(--color-milestone-tint)' : 'none'}
                  strokeWidth={isLast ? 8 : 0}
                />
              );
            })}
          </svg>
        </div>
      </section>

      <section className="landing-section">
        <span className="eyebrow">How it works</span>
        <h2>Four steps, one thread the whole way through</h2>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.stage}>
              <span className="badge badge-neutral">{s.stage}</span>
              <h3>{s.title}</h3>
              <p className="mb-0">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <span className="eyebrow">What gets checked</span>
        <h2>Five areas every 2–3 year old is growing in</h2>
        <div className="domains-list">
          {DOMAINS.map((d) => (
            <div className="domain-row" key={d.code}>
              <span className="mono domain-code">{d.code}</span>
              <div>
                <strong>{d.name}</strong>
                <p className="mb-0 text-sm">{d.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-cta">
        <h2>No waiting room. No referral needed to begin.</h2>
        <p>Create a free account and answer your first questionnaire in a few minutes.</p>
        <Link to="/signup" className="btn btn-primary">Get started</Link>
      </section>

      <footer className="landing-footer">
        <span>Early Steps Screening</span>
        <span className="muted text-sm">Reviewed by real people. Not a diagnosis — a first, informed step.</span>
      </footer>
    </div>
  );
}
