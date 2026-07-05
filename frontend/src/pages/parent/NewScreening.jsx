import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { ErrorAlert } from '../../components/Feedback.jsx';

const QUESTIONS = [
  { id: 'q_two_word_phrases', domain: 'Communication', text: 'Uses 2-word phrases (e.g. "more milk")' },
  { id: 'q_follows_instructions', domain: 'Communication', text: 'Follows a simple 2-step instruction' },
  { id: 'q_runs_steady', domain: 'Gross motor', text: 'Runs with reasonable balance' },
  { id: 'q_kicks_ball', domain: 'Gross motor', text: 'Kicks a ball forward' },
  { id: 'q_stacks_blocks', domain: 'Fine motor', text: 'Stacks 4 or more blocks' },
  { id: 'q_scribbles', domain: 'Fine motor', text: 'Scribbles spontaneously with a crayon' },
  { id: 'q_sorts_shapes', domain: 'Problem solving', text: 'Sorts shapes or matches simple objects' },
  { id: 'q_pretend_play', domain: 'Personal-social', text: 'Engages in simple pretend play' },
];

const OPTIONS = [
  { label: 'Yes, consistently', value: 10 },
  { label: 'Sometimes', value: 5 },
  { label: 'Not yet', value: 0 },
];

export default function NewScreening() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(params.get('childId') || '');
  const [answers, setAnswers] = useState({});
  const [intake, setIntake] = useState('');
  const [video, setVideo] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client.get('/children').then((res) => {
      setChildren(res.data.children);
      if (!childId && res.data.children[0]) setChildId(res.data.children[0]._id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAnswer = (id, value) => setAnswers((a) => ({ ...a, [id]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!childId) {
      setError('Please select a child.');
      return;
    }
    if (Object.keys(answers).length < QUESTIONS.length) {
      setError('Please answer every question.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('childId', childId);
      formData.append('questionnaireAnswers', JSON.stringify(answers));
      formData.append('intake', intake);
      if (video) formData.append('video', video);

      const res = await client.post('/screenings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/screenings/${res.data.screening._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">New submission</span>
          <h1>Start a screening</h1>
        </div>
      </div>

      <ErrorAlert message={error} />

      <form onSubmit={submit} className="stack">
        <div className="card">
          <h3>Which child is this for?</h3>
          <div className="field mb-0">
            <select value={childId} onChange={(e) => setChildId(e.target.value)}>
              <option value="">Select a child…</option>
              {children.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card">
          <h3>Developmental questionnaire</h3>
          <p className="text-sm muted">
            Answer based on what you've observed in the last month.
          </p>
          <div className="stack">
            {QUESTIONS.map((q) => (
              <div key={q.id} style={{ paddingBottom: 'var(--sp-3)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="text-sm muted mono" style={{ marginBottom: 2 }}>{q.domain}</div>
                <div style={{ fontWeight: 600, marginBottom: 'var(--sp-2)' }}>{q.text}</div>
                <div className="radio-row">
                  {OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`radio-card ${answers[q.id] === opt.value ? 'checked-low' : ''}`}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === opt.value}
                        onChange={() => setAnswer(q.id, opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Anything else you'd like the reviewer to know?</h3>
          <div className="field mb-0">
            <textarea
              placeholder="Context, concerns, or recent changes you've noticed..."
              value={intake}
              onChange={(e) => setIntake(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <h3>Video (optional)</h3>
          <p className="text-sm muted">
            A short clip of your child playing helps the reviewer assess motor and social skills.
            MP4 or MOV, up to 250MB.
          </p>
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            onChange={(e) => setVideo(e.target.files[0] || null)}
          />
        </div>

        <button className="btn btn-primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
          {submitting ? 'Submitting…' : 'Submit screening'}
        </button>
      </form>
    </div>
  );
}
