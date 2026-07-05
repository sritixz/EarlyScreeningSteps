import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { Loading, EmptyState, ErrorAlert } from '../../components/Feedback.jsx';
import { RiskBadge, UrgentBadge } from '../../components/Badges.jsx';

function ageLabel(months) {
  if (months == null) return '';
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m} mo`;
  return `${y}y ${m}mo`;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState(null);
  const [screeningsByChild, setScreeningsByChild] = useState({});
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', dateOfBirth: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await client.get('/children');
      setChildren(res.data.children);
      const entries = await Promise.all(
        res.data.children.map((c) =>
          client.get('/screenings', { params: { childId: c._id } }).then((r) => [c._id, r.data.screenings])
        )
      );
      setScreeningsByChild(Object.fromEntries(entries));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addChild = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await client.post('/children', form);
      setForm({ name: '', dateOfBirth: '' });
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (children === null) return <Loading label="Loading your children" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Parent portal</span>
          <h1>Your children</h1>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd((s) => !s)}>
          {showAdd ? 'Cancel' : '+ Add a child'}
        </button>
      </div>

      <ErrorAlert message={error} />

      {showAdd && (
        <div className="card" style={{ marginBottom: 'var(--sp-5)' }}>
          <h3>Add a child</h3>
          <form onSubmit={addChild}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="cname">Name</label>
                <input
                  id="cname"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="cdob">Date of birth</label>
                <input
                  id="cdob"
                  type="date"
                  required
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save child'}
            </button>
          </form>
        </div>
      )}

      {children.length === 0 && !showAdd && (
        <EmptyState
          title="No children added yet"
          body="Add your child's profile to start a developmental screening."
          action={
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              + Add a child
            </button>
          }
        />
      )}

      {children.map((child) => {
        const screenings = screeningsByChild[child._id] || [];
        return (
          <div className="card" key={child._id}>
            <div className="card-row">
              <div>
                <h3 style={{ marginBottom: 2 }}>{child.name}</h3>
                <span className="text-sm muted">{ageLabel(child.ageInMonths)} old</span>
              </div>
              <Link className="btn btn-primary btn-sm" to={`/screenings/new?childId=${child._id}`}>
                Start a screening
              </Link>
            </div>

            {screenings.length > 0 && (
              <div style={{ marginTop: 'var(--sp-4)' }}>
                {screenings.map((s) => (
                  <div className="list-item" key={s._id}>
                    <div>
                      <Link to={`/screenings/${s._id}`}>
                        Screening from {new Date(s.createdAt).toLocaleDateString()}
                      </Link>
                      <div className="meta">Status: {s.status.replace('_', ' ')}</div>
                    </div>
                    <div className="row">
                      {s.isUrgent && <UrgentBadge />}
                      <RiskBadge level={s.review?.riskLevel} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {screenings.length === 0 && (
              <p className="text-sm muted" style={{ marginTop: 'var(--sp-3)' }}>
                No screenings yet for {child.name}.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
