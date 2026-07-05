import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_BY_ROLE = {
  parent: [
    { to: '/dashboard', label: 'My children', end: true },
    { to: '/screenings/new', label: 'Start a screening' },
  ],
  reviewer: [
    { to: '/dashboard', label: 'My worklist', end: true },
  ],
  admin: [
    { to: '/dashboard', label: 'Overview', end: true },
    { to: '/admin/applications', label: 'Reviewer applications' },
    { to: '/admin/urgent', label: 'Urgent cases' },
  ],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navItems = NAV_BY_ROLE[user?.role] || [];

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          Early Steps <small>Screening</small>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="who">{user?.name}</div>
          <span className="role-tag">{user?.role}</span>
          <button onClick={logout}>Sign out</button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
