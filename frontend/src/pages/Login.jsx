import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ALN-9: set by the register page after a registration.
  const justRegistered = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axiosInstance.post('/api/auth/login', formData);
      login(response.data);
      navigate(response.data.role === 'admin' ? '/admin/verifications' : '/profile');
    } catch (err) {
      // ALN-27: show the problem on the page instead of a browser pop-up.
      setError("We couldn't log you in. Check your email and password.");
    }
  };

  const inputClass =
    'w-full p-2 border border-line rounded-lg text-ink focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  return (
    <div className="max-w-md mx-auto mt-16 mb-10 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 border border-line rounded-xl">
        <h1 className="text-2xl font-bold mb-1 text-center text-ink">Log in</h1>
        <p className="text-sm text-muted mb-5 text-center">Welcome back to AlumniLink.</p>

        {justRegistered && (
          <p role="status" className="mb-4 text-sm font-semibold text-brand">
            ✓ Registration received. Your application is pending.
          </p>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-semibold mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={inputClass}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-semibold mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className={inputClass}
          />
        </div>

        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}

        <button type="submit" className="w-full bg-brand hover:bg-brand-hover text-white font-bold p-2 rounded-lg">
          Log in
        </button>

        <p className="text-sm text-center mt-4 text-muted">
          New here? <Link to="/register" className="text-brand font-semibold underline">Join AlumniLink</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
