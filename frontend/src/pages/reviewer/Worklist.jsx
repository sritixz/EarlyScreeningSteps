import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Loading, EmptyState, ErrorAlert } from '../../components/Feedback.jsx';
import { RiskBadge, UrgentBadge, StatusBadge } from '../../components/Badges.jsx';

export default function Worklist() {
  const { user } = useAuth();
  const [screenings, setScreenings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user.applicationStatus !== 'approved') return;
    client
      .get('/screenings')
      .then((res) => setScreenings(res.data.screenings))
      .catch((err) => setError(getErrorMessage(err)));
  }, [user.applicationStatus]);

  if (user.applicationStatus === 'pending') {
    return (
      <EmptyState
        title="Your application is under review"
        body="Our admin team is verifying your license number. You'll be able to see your worklist as soon as you're approved."
      />
    );
  }

  if (user.applicationStatus === 'rejected') {
    return (
      <EmptyState
        title="Application not approved"
        body="Your reviewer application wasn't approved. Contact support if you believe this is a mistake."
      />
    );
  }

  if (error) return <ErrorAlert message={error} />;
  if (!screenings) return <Loading label="Loading your worklist" />;

  const open = screenings.filter((s) => s.status !== 'completed');
  const completed = screenings.filter((s) => s.status === 'completed');

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Reviewer portal</span>
          <h1>My worklist</h1>
        </div>
        <span
          className="text-sm muted"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: user.isAvailable ? 'var(--color-risk-low)' : 'var(--color-border-strong)',
            }}
          />
          {user.isAvailable ? 'Available for new cases' : 'Not accepting new cases'}
        </span>
      </div>

      {open.length === 0 && (
        <EmptyState title="Your worklist is clear" body="New cases will appear here as they're assigned to you." />
      )}

      {open.map((s) => (
        <div className="card" key={s._id}>
          <div className="card-row">
            <div>
              <Link to={`/screenings/${s._id}`}>
                <h3 style={{ marginBottom: 2 }}>{s.childId?.name}</h3>
              </Link>
              <span className="text-sm muted">
                Submitted {new Date(s.createdAt).toLocaleDateString()} · Parent: {s.parentId?.name}
              </span>
            </div>
            <div className="row">
              {s.isUrgent && <UrgentBadge />}
              <StatusBadge status={s.status} />
            </div>
          </div>
        </div>
      ))}

      {completed.length > 0 && (
        <>
          <h3 style={{ marginTop: 'var(--sp-6)' }}>Completed</h3>
          {completed.map((s) => (
            <div className="card" key={s._id}>
              <div className="card-row">
                <div>
                  <Link to={`/screenings/${s._id}`}>{s.childId?.name}</Link>
                  <div className="text-sm muted">
                    Reviewed {s.review?.completedAt && new Date(s.review.completedAt).toLocaleDateString()}
                  </div>
                </div>
                <RiskBadge level={s.review?.riskLevel} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
