import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

// ALN-9 (R1): registration with graduation details, privacy consent and field-level errors.
const emptyForm = {
  name: '',
  email: '',
  password: '',
  institution: '',
  degree: '',
  graduationYear: '',
  studentId: '',
  verificationLink: '',
  consent: false,
};

const FieldError = ({ message }) =>
  message ? <p className="text-sm text-danger mt-1">{message}</p> : null;

const Register = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    // Clear a field's error as soon as the user edits it.
    setErrors({ ...errors, [name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage('');
    try {
      await axiosInstance.post('/api/auth/register', formData);
      navigate('/login', { state: { registered: true } });
    } catch (error) {
      const data = error.response?.data;
      setErrors(data?.errors || {});
      setFormMessage(data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full p-2 border rounded text-ink focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-danger focus:ring-danger/20'
        : 'border-line focus:border-brand focus:ring-brand/20'
    }`;

  return (
    <div className="max-w-md mx-auto mt-10 mb-10">
      <form onSubmit={handleSubmit} noValidate className="bg-white p-6 border border-line rounded-lg">
        <h1 className="text-2xl font-bold mb-2 text-center text-ink">Join AlumniLink</h1>
        <p className="text-sm text-muted mb-4 text-center">
          An administrator checks your  details before you can use the community.
        </p>

        {formMessage && (
          <p className="mb-4 rounded border border-danger-border bg-danger-bg p-3 text-sm text-danger">{formMessage}</p>
        )}

        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1 text-ink">Full name</label>
          <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={inputClass('name')} />
          <FieldError message={errors.name} />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1 text-ink">Email</label>
          <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={inputClass('email')} />
          <FieldError message={errors.email} />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-1 text-ink">Password (at least 8 characters)</label>
          <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} className={inputClass('password')} />
          <FieldError message={errors.password} />
        </div>

        <h2 className="text-lg font-semibold mt-6 mb-2 text-ink">Graduation details</h2>

        <div className="mb-4">
          <label htmlFor="institution" className="block text-sm font-medium mb-1 text-ink">Institution</label>
          <input id="institution" name="institution" type="text" value={formData.institution} onChange={handleChange} className={inputClass('institution')} />
          <FieldError message={errors.institution} />
        </div>

        <div className="mb-4">
          <label htmlFor="degree" className="block text-sm font-medium mb-1 text-ink">Degree</label>
          <input id="degree" name="degree" type="text" value={formData.degree} onChange={handleChange} className={inputClass('degree')} />
          <FieldError message={errors.degree} />
        </div>

        <div className="mb-4">
          <label htmlFor="graduationYear" className="block text-sm font-medium mb-1 text-ink">Graduation year</label>
          <input id="graduationYear" name="graduationYear" type="number" value={formData.graduationYear} onChange={handleChange} className={inputClass('graduationYear')} />
          <FieldError message={errors.graduationYear} />
        </div>

        <div className="mb-4">
          <label htmlFor="studentId" className="block text-sm font-medium mb-1 text-ink">Student ID</label>
          <input id="studentId" name="studentId" type="text" value={formData.studentId} onChange={handleChange} className={inputClass('studentId')} />
          <FieldError message={errors.studentId} />
        </div>

        <div className="mb-4">
          <label htmlFor="verificationLink" className="block text-sm font-medium mb-1 text-ink">Verification link</label>
          <input id="verificationLink" name="verificationLink" type="url" placeholder="https://www.linkedin.com/in/your-profile" value={formData.verificationLink} onChange={handleChange} className={inputClass('verificationLink')} />
          <p className="text-xs text-muted mt-1">A link that shows your degree, such as a My eQuals share link or your LinkedIn education entry.</p>
          <FieldError message={errors.verificationLink} />
        </div>

        <div className="mb-4">
          <label className="flex items-start gap-2 text-sm text-ink">
            <input name="consent" type="checkbox" checked={formData.consent} onChange={handleChange} className="mt-1 accent-brand" />
            <span>
              I agree that AlumniLink stores these details so an administrator can verify my graduation.
              They are never shown to other members.
            </span>
          </label>
          <FieldError message={errors.consent} />
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-brand hover:bg-brand-hover text-white font-medium p-2 rounded disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Register'}
        </button>

        <p className="text-sm text-center mt-4 text-muted">
          Already a member? <Link to="/login" className="text-brand font-medium underline">Log in</Link>
        </p>
      </form>
    </div>
  );
};

export default Register;