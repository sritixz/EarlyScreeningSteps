import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client, { getErrorMessage } from '../api/client.js';
import { Loading, ErrorAlert } from '../components/Feedback.jsx';
import StepProgress from '../components/StepProgress.jsx';
import { RiskBadge, UrgentBadge } from '../components/Badges.jsx';
import MessageThread from '../components/MessageThread.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ScreeningDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [screening, setScreening] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get(`/screenings/${id}`)
      .then((res) => setScreening(res.data.screening))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <ErrorAlert message={error} />;
  if (!screening) return <Loading label="Loading screening" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <Link to="/">← {user.role === 'admin' ? 'Back to overview' : 'Back to children'}</Link>
          </span>
          <h1>{screening.childId?.name}'s screening</h1>
        </div>
        <div className="row">
          {screening.isUrgent && <UrgentBadge />}
          <RiskBadge level={screening.review?.riskLevel} />
        </div>
      </div>

      <div className="card">
        <StepProgress status={screening.status} />
      </div>

      <div className="card">
        <h3>Assigned reviewer</h3>
        {screening.assignedReviewerId ? (
          <p className="mb-0">
            {screening.assignedReviewerId.name}
            {screening.assignedReviewerId.specialty && ` · ${screening.assignedReviewerId.specialty}`}
          </p>
        ) : (
          <p className="mb-0 muted">Waiting to be assigned to a reviewer.</p>
        )}
      </div>

      {screening.intake && (
        <div className="card">
          <h3>What you shared</h3>
          <p className="mb-0">{screening.intake}</p>
        </div>
      )}

      {screening.status === 'completed' && screening.review && (
        <div className="card">
          <h3>Reviewer's findings</h3>
          <div className="row" style={{ marginBottom: 'var(--sp-3)' }}>
            <RiskBadge level={screening.review.riskLevel} />
          </div>
          {screening.review.observations?.length > 0 && (
            <>
              <strong>Observations</strong>
              <ul>
                {screening.review.observations.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </>
          )}
          {screening.review.recommendedNextSteps && (
            <>
              <strong>Recommended next steps</strong>
              <p>{screening.review.recommendedNextSteps}</p>
            </>
          )}
          {screening.review.notes && (
            <>
              <strong>Additional notes</strong>
              <p className="mb-0">{screening.review.notes}</p>
            </>
          )}
        </div>
      )}

      <div className="card">
        <MessageThread screeningId={id} />
      </div>
    </div>
  );
}
