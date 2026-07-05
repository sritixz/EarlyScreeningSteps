const STAGES = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_review', label: 'In review' },
  { key: 'completed', label: 'Completed' },
];

export default function StepProgress({ status }) {
  const currentIndex = STAGES.findIndex((s) => s.key === status);

  return (
    <div>
      <div className="step-progress">
        {STAGES.map((stage, i) => (
          <div
            className={`step ${i < currentIndex ? 'done' : ''} ${
              i === currentIndex ? 'current' : ''
            }`}
            key={stage.key}
          >
            <div className="dot" />
            {i < STAGES.length - 1 && <div className="line" />}
          </div>
        ))}
      </div>
      <div className="step-labels">
        {STAGES.map((stage, i) => (
          <span key={stage.key} className={`label ${i <= currentIndex ? 'reached' : ''}`}>
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}
