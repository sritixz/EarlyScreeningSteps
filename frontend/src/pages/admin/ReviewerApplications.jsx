import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../../api/client.js';
import { Loading, EmptyState, ErrorAlert } from '../../components/Feedback.jsx';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ReviewerApplications() {
  const [tab, setTab] = useState('pending');
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async (status) => {
    setApplications(null);
    try {
      const res = await client.get('/admin/reviewer-applications', { params: { status } });
      setApplications(res.data.applications);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  const act = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      if (action === 'deactivate') {
        await client.patch(`/admin/reviewers/${id}/deactivate`);
      } else {
        await client.patch(`/admin/reviewer-applications/${id}/${action}`);
      }
      await load(tab);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Admin portal</span>
          <h1>Reviewer applications</h1>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 'var(--sp-5)' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={tab === t.key ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorAlert message={error} />

      {applications === null && <Loading label="Loading applications" />}

      {applications?.length === 0 && (
        <EmptyState title={`No ${tab} applications`} />
      )}

      {applications?.map((r) => (
        <div className="card" key={r._id}>
          <div className="card-row">
            <div>
              <h3 style={{ marginBottom: 2 }}>{r.name}</h3>
              <span className="text-sm muted">{r.email}</span>
              <div className="text-sm" style={{ marginTop: 'var(--sp-2)' }}>
                <span className="mono">License: {r.licenseNumber}</span>
                {r.specialty && <span> · {r.specialty}</span>}
              </div>
              <div className="text-sm muted">Jurisdiction: {r.jurisdiction}</div>
            </div>
            <div className="row">
              {tab === 'pending' && (
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={busyId === r._id}
                    onClick={() => act(r._id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={busyId === r._id}
                    onClick={() => act(r._id, 'reject')}
                  >
                    Reject
                  </button>
                </>
              )}
              {tab === 'approved' && r.isActive && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={busyId === r._id}
                  onClick={() => act(r._id, 'deactivate')}
                >
                  Deactivate
                </button>
              )}
              {tab === 'approved' && !r.isActive && (
                <span className="badge badge-neutral">Deactivated</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
