import { GUIDES, guideById, DIFFICULTY_LABELS } from '../data/guides'

function DifficultyTag({ level }) {
  return <span className={`difficulty difficulty-${level}`}>{DIFFICULTY_LABELS[level]}</span>
}

function GuideDetail({ guide, onBack }) {
  return (
    <div className="page guide-page">
      <button className="btn btn-small" onClick={onBack}>← All guides</button>
      <h1>{guide.title}</h1>
      <div className="guide-meta">
        <DifficultyTag level={guide.difficulty} />
        <span className="muted">⏱ {guide.time}</span>
        <span className="muted">💵 {guide.savings}</span>
      </div>

      <p className="guide-why">{guide.why}</p>

      <section>
        <h2>What you'll need</h2>
        <ul className="tool-list">
          {guide.tools.map((t) => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section>
        <h2>Steps</h2>
        <ol className="step-list">
          {guide.steps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </section>

      <section className="safety-box">
        <h2>⚠ Safety notes</h2>
        <p>{guide.safety}</p>
      </section>

      <p className="muted guide-disclaimer">
        These are general instructions — details vary by make and model. When in doubt, check your
        owner's manual or a video for your exact vehicle, and leave anything you're not comfortable
        with to a professional.
      </p>
    </div>
  )
}

export default function Guides({ params, navigate }) {
  const guide = params?.guideId ? guideById(params.guideId) : null
  if (guide) return <GuideDetail guide={guide} onBack={() => navigate('guides')} />

  const sorted = [...GUIDES].sort((a, b) => a.difficulty - b.difficulty)

  return (
    <div className="page">
      <div className="page-head">
        <h1>DIY Guides</h1>
      </div>
      <p className="muted">
        Most routine maintenance is easier than it looks. Start with the easy jobs — they need almost
        no tools and save real money every time.
      </p>
      <div className="card-grid">
        {sorted.map((g) => (
          <button key={g.id} className="guide-card" onClick={() => navigate('guides', { guideId: g.id })}>
            <div className="guide-card-title">{g.title}</div>
            <div className="guide-meta">
              <DifficultyTag level={g.difficulty} />
              <span className="muted">⏱ {g.time}</span>
            </div>
            <div className="muted guide-card-savings">💵 {g.savings}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
