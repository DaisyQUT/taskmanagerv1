import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ALN-27: white bar with the purple logo. NavLink marks the page you are on,
// so the current page shows in purple and bold instead of using a coloured button.
const linkClass = ({ isActive }) =>
  isActive ? 'font-bold text-brand' : 'text-muted hover:text-ink';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-line">
      <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/" className="text-lg font-bold text-brand">AlumniLink</Link>
        <div className="flex items-center gap-6 text-sm">
          {user ? (
            <>
              {user.role === 'admin' && (
                <NavLink to="/admin/verifications" className={linkClass}>Verification queue</NavLink>
              )}
              <NavLink to="/profile" className={linkClass}>Profile</NavLink>
              <button type="button" onClick={handleLogout} className="text-muted hover:text-ink">
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Log in</NavLink>
              <NavLink to="/register" className={linkClass}>Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
