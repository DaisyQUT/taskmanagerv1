import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

// Matches our target of deciding every application within 2 business days.
const ATTENTION_AFTER_DAYS = 2;

const Detail = ({ label, children }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm text-ink">{children}</dd>
  </div>
);

const WaitingBadge = ({ days }) => {
  const overdue = days >= ATTENTION_AFTER_DAYS;
  const style = overdue
    ? 'border-warning-border bg-warning-bg text-warning'
    : 'border-line bg-surface text-muted';
  const label = days === 0 ? 'Submitted today' : `Waiting ${days} day${days === 1 ? '' : 's'}`;
  return <span className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${style}`}>{label}</span>;
};

const VerificationQueue = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Log in as an admin to see the verification queue.');
      return;
    }

    const fetchQueue = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/verifications', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setApplications(response.data);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? 'Only admins can see the verification queue.'
            : "We couldn't load the queue. Try again in a moment."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold text-ink">Verification queue</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Oldest first. Open each link to confirm the degree before you decide.
      </p>

      {loading && <p className="text-sm text-muted">Loading applications</p>}

      {!loading && error && (
        <p className="rounded border border-danger-border bg-danger-bg p-3 text-sm text-danger">{error}</p>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-lg border border-line bg-white p-8 text-center">
          <p className="font-medium text-ink">Nothing to review</p>
          <p className="text-sm text-muted mt-1">New applications appear here when graduates register.</p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <ul className="divide-y divide-line rounded-lg border border-line bg-white">
          {applications.map((application) => (
            <li key={application.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{application.name}</p>
                  <p className="text-sm text-muted">{application.email}</p>
                </div>
                <WaitingBadge days={application.daysWaiting} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
                <Detail label="Institution">{application.institution}</Detail>
                <Detail label="Degree">{application.degree}</Detail>
                <Detail label="Graduation year">{application.graduationYear}</Detail>
                <Detail label="Student ID">{application.studentId}</Detail>
              </dl>
              <a
                href={application.verificationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-brand underline"
              >
                Open verification link
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VerificationQueue;