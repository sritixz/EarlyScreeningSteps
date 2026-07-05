import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client, { getErrorMessage } from '../../api/client.js';
import { Loading, ErrorAlert, SuccessAlert } from '../../components/Feedback.jsx';
import StepProgress from '../../components/StepProgress.jsx';
import { RiskBadge, UrgentBadge } from '../../components/Badges.jsx';
import MessageThread from '../../components/MessageThread.jsx';

const RISK_LEVELS = ['low', 'medium', 'high'];

export default function ReviewScreening() {
  const { id } = useParams();
  const [screening, setScreening] = useState(null);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [reviewForm, setReviewForm] = useState({
    riskLevel: '',
    observations: '',
    recommendedNextSteps: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const [urgentReason, setUrgentReason] = useState('');
  const [showUrgentForm, setShowUrgentForm] = useState(false);
  const [flagging, setFlagging] = useState(false);

  const load = async () => {
    try {
      const res = await client.get(`/screenings/${id}`);
      setScreening(res.data.screening);

      if (res.data.screening.status === 'assigned') {
        await client.patch(`/screenings/${id}/start`);
      }

      const historyRes = await client.get(
        `/screenings/child/${res.data.screening.childId._id}/history`
      );
      setHistory(historyRes.data.screenings.filter((s) => s._id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.riskLevel) {
      setError('Select a risk level before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await client.post(`/reviews/${id}`, {
        riskLevel: reviewForm.riskLevel,
        observations: reviewForm.observations
          .split('\n')
          .map((o) => o.trim())
          .filter(Boolean),
        recommendedNextSteps: reviewForm.recommendedNextSteps,
        notes: reviewForm.notes,
      });
      setScreening(res.data.screening);
      setSuccess('Review submitted. This cannot be edited once submitted.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const flagUrgent = async (e) => {
    e.preventDefault();
    if (!urgentReason.trim()) return;
    setFlagging(true);
    setError('');
    try {
      const res = await client.post(`/reviews/${id}/flag-urgent`, { reason: urgentReason });
      setScreening(res.data.screening);
      setShowUrgentForm(false);
      setUrgentReason('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFlagging(false);
    }
  };

  if (error && !screening) return <ErrorAlert message={error} />;
  if (!screening) return <Loading label="Loading case" />;

  const isCompleted = screening.status === 'completed';

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">
            <Link to="/">← Worklist</Link>
          </span>
          <h1>{screening.childId?.name}</h1>
        </div>
        <div className="row">
          {screening.isUrgent && <UrgentBadge />}
          <RiskBadge level={screening.review?.riskLevel} />
        </div>
      </div>

      <div className="card">
        <StepProgress status={screening.status} />
      </div>

      {!screening.isUrgent && !isCompleted && (
        <div className="card">
          {!showUrgentForm ? (
            <button className="btn btn-danger" onClick={() => setShowUrgentForm(true)}>
              Flag as urgent
            </button>
          ) : (
            <form onSubmit={flagUrgent}>
              <div className="field">
                <label>Why is this urgent?</label>
                <textarea
                  required
                  value={urgentReason}
                  onChange={(e) => setUrgentReason(e.target.value)}
                  placeholder="Describe the concern for the admin team..."
                />
              </div>
              <div className="row">
                <button className="btn btn-danger" disabled={flagging}>
                  {flagging ? 'Flagging…' : 'Confirm urgent flag'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUrgentForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {screening.isUrgent && (
        <div className="alert alert-urgent">
          <span>Flagged urgent: {screening.urgentReason}</span>
          {!screening.urgentAcknowledgedAt && <span>Awaiting admin acknowledgment</span>}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Intake notes from parent</h3>
          <p className="mb-0">{screening.intake || <span className="muted">None provided.</span>}</p>
        </div>
        <div className="card">
          <h3>Video</h3>
          {screening.videoMetadata?.filename ? (
            <p className="mb-0 mono text-sm">
              {screening.videoMetadata.originalName} (
              {(screening.videoMetadata.sizeBytes / (1024 * 1024)).toFixed(1)} MB)
            </p>
          ) : (
            <p className="mb-0 muted">No video was submitted.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Questionnaire responses</h3>
        <p className="text-sm muted">Total score: <span className="mono">{screening.totalScore}</span></p>
        <div className="grid-2">
          {Object.entries(screening.questionnaireAnswers || {}).map(([key, value]) => (
            <div key={key} className="text-sm" style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)' }}>
              <span className="mono muted">{key}</span>: <strong>{String(value)}</strong>
            </div>
          ))}
        </div>
      </div>

      {history && history.length > 0 && (
        <div className="card">
          <h3>Prior screenings for {screening.childId?.name}</h3>
          {history.map((h) => (
            <div className="list-item" key={h._id}>
              <span>{new Date(h.createdAt).toLocaleDateString()}</span>
              <RiskBadge level={h.review?.riskLevel} />
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <h3>Review</h3>
        <SuccessAlert message={success} />
        <ErrorAlert message={error} />

        {isCompleted ? (
          <div>
            <RiskBadge level={screening.review.riskLevel} />
            {screening.review.observations?.length > 0 && (
              <>
                <p style={{ marginTop: 'var(--sp-3)' }}><strong>Observations</strong></p>
                <ul>
                  {screening.review.observations.map((o, i) => <li key={i}>{o}</li>)}
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
                <strong>Notes</strong>
                <p className="mb-0">{screening.review.notes}</p>
              </>
            )}
            <p className="text-sm muted" style={{ marginTop: 'var(--sp-3)' }}>
              This review was submitted and is now immutable.
            </p>
          </div>
        ) : (
          <form onSubmit={submitReview}>
            <div className="field">
              <label>Risk level</label>
              <div className="radio-row">
                {RISK_LEVELS.map((level) => (
                  <label
                    key={level}
                    className={`radio-card ${reviewForm.riskLevel === level ? `checked-${level}` : ''}`}
                  >
                    <input
                      type="radio"
                      name="riskLevel"
                      checked={reviewForm.riskLevel === level}
                      onChange={() => setReviewForm({ ...reviewForm, riskLevel: level })}
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Observations</label>
              <textarea
                placeholder="One observation per line..."
                value={reviewForm.observations}
                onChange={(e) => setReviewForm({ ...reviewForm, observations: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Recommended next steps</label>
              <textarea
                value={reviewForm.recommendedNextSteps}
                onChange={(e) => setReviewForm({ ...reviewForm, recommendedNextSteps: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Additional notes</label>
              <textarea
                value={reviewForm.notes}
                onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
            <p className="hint" style={{ marginTop: 'var(--sp-2)' }}>
              Reviews cannot be edited once submitted.
            </p>
          </form>
        )}
      </div>

      <div className="card">
        <MessageThread screeningId={id} />
      </div>
    </div>
  );
}
