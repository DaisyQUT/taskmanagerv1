import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';

// Matches our target of deciding every application within 2 business days.
const ATTENTION_AFTER_DAYS = 2;
const MIN_REASON_LENGTH = 10;

const Detail = ({ label, children }) => (
  <div>
    <dt className="text-xs text-muted">{label}</dt>
    <dd className="text-sm text-ink">{children}</dd>
  </div>
);

// ALN-27: no coloured badge. Overdue applications stand out with a filled dot,
// purple and bold; everything else is plain grey text.
const WaitingBadge = ({ days }) => {
  const overdue = days >= ATTENTION_AFTER_DAYS;
  const label = days === 0 ? 'Submitted today' : `Waiting ${days} day${days === 1 ? '' : 's'}`;
  return (
    <span className={`whitespace-nowrap text-sm ${overdue ? 'font-bold text-brand' : 'text-muted'}`}>
      {overdue && '● '}{label}
    </span>
  );
};

const VerificationQueue = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const removeFromQueue = (id, message) => {
    setApplications(applications.filter((application) => application.id !== id));
    setNotice(message);
    setRejectingId(null);
    setReason('');
    setReasonError('');
  };

  const showDecisionError = (err, application) => {
    if (err.response?.status === 409) {
      removeFromQueue(application.id, `Another admin has already decided ${application.name}'s application.`);
    } else {
      setNotice('');
      setError("We couldn't save that decision. Try again in a moment.");
    }
  };

  const approve = async (application) => {
    if (!window.confirm(`Approve ${application.name}? They'll get full access straight away.`)) return;

    setSaving(true);
    try {
      await axiosInstance.patch(`/api/admin/verifications/${application.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      removeFromQueue(application.id, `${application.name} is approved.`);
    } catch (err) {
      showDecisionError(err, application);
    } finally {
      setSaving(false);
    }
  };

  const reject = async (application) => {
    if (reason.trim().length < MIN_REASON_LENGTH) {
      setReasonError(`Write at least ${MIN_REASON_LENGTH} characters so they know what to fix.`);
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.patch(`/api/admin/verifications/${application.id}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      removeFromQueue(application.id, `${application.name} is rejected. Your reason is saved with their application.`);
    } catch (err) {
      showDecisionError(err, application);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold text-ink">Verification queue</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Oldest first. Open each link to confirm the degree before you decide.
      </p>

      {notice && (
        <p role="status" className="mb-4 text-sm font-semibold text-brand">
          ✓ {notice}
        </p>
      )}

      {loading && <p className="text-sm text-muted">Loading applications</p>}

      {!loading && error && (
        <p role="alert" className="text-sm text-danger">{error}</p>
      )}

      {!loading && !error && applications.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-8 text-center">
          <p className="font-medium text-ink">Nothing to review</p>
          <p className="text-sm text-muted mt-1">New applications appear here when graduates register.</p>
        </div>
      )}

      {!loading && !error && applications.length > 0 && (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
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

              {rejectingId !== application.id && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => approve(application)}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setRejectingId(application.id)}
                    className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-surface disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}

              {rejectingId === application.id && (
                <div className="mt-4 border-t border-line pt-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-ink">
                    Reason for rejecting
                  </label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError('');
                    }}
                    className={`mt-1 w-full rounded-lg border p-2 text-sm text-ink ${reasonError ? 'border-danger' : 'border-line'}`}
                  />
                  <p className="text-xs text-muted">Say what they need to fix. At least {MIN_REASON_LENGTH} characters.</p>
                  {reasonError && <p className="mt-1 text-sm text-danger">{reasonError}</p>}

                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => reject(application)}
                      className="rounded-lg bg-danger px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                      Reject application
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setRejectingId(null);
                        setReason('');
                        setReasonError('');
                      }}
                      className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold text-ink hover:bg-surface disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VerificationQueue;