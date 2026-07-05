import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { Loading, EmptyState, ErrorAlert } from '../../components/Feedback.jsx';
import { RiskBadge } from '../../components/Badges.jsx';

export default function UrgentDashboard() {
  const [screenings, setScreenings] = useState(null);
  const [reviewers, setReviewers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reassignTarget, setReassignTarget] = useState({});

  const load = async () => {
    try {
      const [urgentRes, reviewersRes] = await Promise.all([
        client.get('/admin/urgent'),
        client.get('/admin/reviewer-applications', { params: { status: 'approved' } }),
      ]);
      setScreenings(urgentRes.data.urgentScreenings);
      setReviewers(reviewersRes.data.applications.filter((r) => r.isActive));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const acknowledge = async (id) => {
    setBusyId(id);
    setError('');
    try {
      await client.patch(`/admin/urgent/${id}/acknowledge`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const reassign = async (id) => {
    const reviewerId = reassignTarget[id];
    if (!reviewerId) return;
    setBusyId(id);
    setError('');
    try {
      await client.patch(`/admin/screenings/${id}/reassign`, { reviewerId });
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (error) return <ErrorAlert message={error} />;
  if (!screenings) return <Loading label="Loading urgent cases" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Admin portal</span>
          <h1>Urgent cases</h1>
        </div>
      </div>

      {screenings.length === 0 && (
        <EmptyState title="No urgent cases" body="Flagged cases will show up here for acknowledgment." />
      )}

      {screenings.map((s) => (
        <div className="card" key={s._id}>
          <div className="card-row">
            <div>
              <Link to={`/screenings/${s._id}`}>
                <h3 style={{ marginBottom: 2 }}>{s.childId?.name}</h3>
              </Link>
              <span className="text-sm muted">
                Flagged by {s.urgentFlaggedBy?.name} ({s.urgentFlaggedBy?.role}) on{' '}
                {new Date(s.urgentFlaggedAt).toLocaleString()}
              </span>
              <p className="text-sm" style={{ marginTop: 'var(--sp-2)' }}>
                "{s.urgentReason}"
              </p>
            </div>
            <RiskBadge level={s.review?.riskLevel} />
          </div>

          <div className="row" style={{ marginTop: 'var(--sp-3)' }}>
            {s.urgentAcknowledgedAt ? (
              <span className="badge badge-neutral">
                Acknowledged by {s.urgentAcknowledgedBy?.name}
              </span>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                disabled={busyId === s._id}
                onClick={() => acknowledge(s._id)}
              >
                Acknowledge
              </button>
            )}

            {s.status !== 'completed' && (
              <>
                <select
                  value={reassignTarget[s._id] || ''}
                  onChange={(e) => setReassignTarget({ ...reassignTarget, [s._id]: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border-strong)' }}
                >
                  <option value="">Reassign to…</option>
                  {reviewers
                    .filter((r) => r._id !== s.assignedReviewerId?._id)
                    .map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.name}
                      </option>
                    ))}
                </select>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={busyId === s._id || !reassignTarget[s._id]}
                  onClick={() => reassign(s._id)}
                >
                  Reassign
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
