import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/client.js';
import { ErrorAlert } from '../components/Feedback.jsx';

const JURISDICTIONS = ['California, US', 'New York, US', 'Texas, US', 'Ontario, CA'];

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('parent');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    jurisdiction: JURISDICTIONS[0],
    licenseNumber: '',
    specialty: '',
    consentAccepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.consentAccepted) {
      setError('Please accept the consent agreement to continue.');
      return;
    }

    setLoading(true);
    try {
      const user = await signup({ ...form, role });
      if (user.role === 'reviewer') {
        navigate('/');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-brand">
          <span className="mark" />
          Early Steps
        </div>
        <p className="auth-sub">
          Screening reviewed by real people, for families who need it most.
        </p>

        <div className="radio-row" style={{ marginBottom: 'var(--sp-5)' }}>
          {['parent', 'reviewer'].map((r) => (
            <label
              key={r}
              className={`radio-card ${role === r ? 'checked-low' : ''}`}
            >
              <input
                type="radio"
                name="role"
                checked={role === r}
                onChange={() => setRole(r)}
              />
              {r === 'parent' ? "I'm a parent" : "I'm a reviewer"}
            </label>
          ))}
        </div>

        <ErrorAlert message={error} />

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" required value={form.name} onChange={set('name')} />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" required value={form.email} onChange={set('email')} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
            />
            <div className="hint">At least 8 characters.</div>
          </div>
          <div className="field">
            <label htmlFor="jurisdiction">Jurisdiction</label>
            <select id="jurisdiction" value={form.jurisdiction} onChange={set('jurisdiction')}>
              {JURISDICTIONS.map((j) => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {role === 'reviewer' && (
            <>
              <div className="field">
                <label htmlFor="licenseNumber">License number</label>
                <input
                  id="licenseNumber"
                  required
                  value={form.licenseNumber}
                  onChange={set('licenseNumber')}
                />
                <div className="hint">Verified offline by our admin team before approval.</div>
              </div>
              <div className="field">
                <label htmlFor="specialty">Specialty</label>
                <input
                  id="specialty"
                  placeholder="e.g. Developmental pediatrics"
                  value={form.specialty}
                  onChange={set('specialty')}
                />
              </div>
            </>
          )}

          <div className="field row" style={{ alignItems: 'flex-start' }}>
            <input
              id="consent"
              type="checkbox"
              style={{ width: 'auto', marginTop: 4 }}
              checked={form.consentAccepted}
              onChange={set('consentAccepted')}
            />
            <label htmlFor="consent" style={{ marginBottom: 0, fontWeight: 400 }}>
              I agree to the consent terms for using Early Steps Screening.
            </label>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
