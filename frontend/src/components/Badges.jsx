export function RiskBadge({ level }) {
  if (!level) return <span className="badge badge-neutral">Not yet assessed</span>;
  return <span className={`badge badge-${level}`}>{level} risk</span>;
}

export function UrgentBadge() {
  return <span className="badge badge-urgent">Urgent</span>;
}

export function StatusBadge({ status }) {
  const labels = {
    submitted: 'Submitted',
    assigned: 'Assigned',
    in_review: 'In review',
    completed: 'Completed',
  };
  return <span className="badge badge-neutral">{labels[status] || status}</span>;
}
