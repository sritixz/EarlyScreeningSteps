import { useEffect, useState } from 'react';
import client, { getErrorMessage } from '../../api/client.js';
import { Loading, ErrorAlert } from '../../components/Feedback.jsx';

function StatCard({ label, value }) {
  return (
    <div className="card stat-card">
      <div className="num">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/admin/stats')
      .then((res) => setStats(res.data.stats))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  if (error) return <ErrorAlert message={error} />;
  if (!stats) return <Loading label="Loading platform stats" />;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Admin portal</span>
          <h1>Platform overview</h1>
        </div>
      </div>

      <div className="grid-2">
        <StatCard label="Parents" value={stats.totalParents} />
        <StatCard label="Approved reviewers" value={stats.approvedReviewers} />
        <StatCard label="Pending applications" value={stats.pendingReviewerApplications} />
        <StatCard label="Total screenings" value={stats.totalScreenings} />
        <StatCard label="Open urgent cases" value={stats.urgentOpenCount} />
        <StatCard label="Completed this month" value={stats.completedThisMonth} />
      </div>

      <div className="card" style={{ marginTop: 'var(--sp-4)' }}>
        <h3>Screenings by status</h3>
        <div className="stack">
          {Object.entries(stats.statusBreakdown).map(([status, count]) => (
            <div className="list-item" key={status}>
              <span>{status.replace('_', ' ')}</span>
              <span className="mono">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
