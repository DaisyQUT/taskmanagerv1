import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

// ALN-26 (R3): what a member sees for each application status. Every status has a symbol and
// a word, so it doesn't rely on colour alone (D11).
const STATUS = {
  pending: {
    label: '○ Pending',
    labelClass: 'text-muted',
    title: 'Application pending',
    text: "We're checking your graduation details. We'll show the decision here once an admin has reviewed your application. Meanwhile, see what's on the boards.",
  },
  approved: {
    label: '✓ Verified',
    labelClass: 'text-brand',
    title: "You're verified",
    text: 'Your graduation details have been confirmed. You can now use the boards.',
  },
  rejected: {
    label: '! Not verified',
    labelClass: 'text-danger',
    title: "We couldn't verify your graduation",
    text: '', // the admin's reason is shown instead
  },
};

const Detail = ({ label, children }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm">{children || 'Not provided'}</dd>
  </div>
);

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get('/api/auth/profile', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProfile(response.data);
        setFormData({ name: response.data.name, email: response.data.email });
      } catch (err) {
        setError("We couldn't load your profile. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await axiosInstance.put('/api/auth/profile', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setNotice('Your changes are saved.');
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't save your changes. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <p className="max-w-2xl mx-auto mt-16 px-4 text-sm text-muted">
        <Link to="/login" className="text-brand font-semibold underline">Log in</Link> to see your profile.
      </p>
    );
  }

  if (loading) {
    return <p className="max-w-2xl mx-auto mt-16 px-4 text-sm text-muted">Loading your profile</p>;
  }

  // Admins are not applicants, so they don't get a status card.
  const status = user.role === 'admin' ? null : STATUS[profile?.verificationStatus];
  const inputClass =
    'w-full p-2 border border-line rounded-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  return (
    <div className="max-w-2xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold">Your profile</h1>
      <p className="text-sm text-muted mt-1 mb-6">Your graduation details and application status.</p>

      {status && (
        <section className="mb-4 rounded-xl border border-line bg-white p-5">
          <p className={`text-xs font-bold uppercase tracking-wider ${status.labelClass}`}>{status.label}</p>
          <h2 className="mt-2 font-bold">{status.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {profile.verificationStatus === 'rejected' ? `Reason: ${profile.rejectionReason}` : status.text}
          </p>
        </section>
      )}

      {profile && user.role !== 'admin' && (
        <section className="mb-4 rounded-xl border border-line bg-white p-5">
          <h2 className="font-bold">Graduation details</h2>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
            <Detail label="Institution">{profile.institution}</Detail>
            <Detail label="Degree">{profile.degree}</Detail>
            <Detail label="Graduation year">{profile.graduationYear}</Detail>
          </dl>
          <p className="mt-3 text-xs text-muted">
            An admin checked these details, so they can't be changed here.
          </p>
        </section>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-line bg-white p-5">
        <h2 className="font-bold mb-3">Account</h2>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-semibold mb-1">Full name</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
          />
        </div>
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

        {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
        {notice && <p role="status" className="mb-4 text-sm font-semibold text-brand">✓ {notice}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand hover:bg-brand-hover text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? 'Saving' : 'Save changes'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
