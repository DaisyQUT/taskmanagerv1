import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { POST_TYPES, FIELDS, EXCHANGES, canUseBoards } from '../postOptions';

// ALN-18 (R8): publish a Request or an Offer. Layout follows wireframe WF2-1.
const DESCRIPTION_MAX = 1000;

const emptyPost = { type: '', title: '', description: '', field: '', exchange: '' };

const FieldError = ({ message }) => (message ? <p className="text-sm text-danger mt-1">{message}</p> : null);

// Radio buttons for the post type and exchange share one look.
const RadioGroup = ({ name, legend, options, value, onChange, error }) => (
  <fieldset className="mb-5">
    <legend className="block text-sm font-semibold mb-2">{legend}</legend>
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={onChange}
            className="accent-brand"
          />
          {option.label}
        </label>
      ))}
    </div>
    <FieldError message={error} />
  </fieldset>
);

const NewPost = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(emptyPost);
  const [errors, setErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!canUseBoards(user)) {
    return (
      <p className="max-w-2xl mx-auto mt-16 px-4 text-sm text-muted">
        Only verified members can post. <Link to="/profile" className="text-brand font-semibold underline">Check your status</Link>.
      </p>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: undefined });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMessage('');
    try {
      await axiosInstance.post('/api/posts', formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      // ALN-25: show the new post on its board, with a confirmation.
      navigate(`/boards?type=${formData.type}`, { state: { notice: 'Your post is live.' } });
    } catch (err) {
      const data = err.response?.data;
      setErrors(data?.errors || {});
      setFormMessage(data?.message || "We couldn't publish your post. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 ${
      errors[field] ? 'border-danger focus:ring-danger/20' : 'border-line focus:border-brand focus:ring-brand/20'
    }`;

  return (
    <div className="max-w-2xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold">New post</h1>
      <p className="text-sm text-muted mt-1 mb-6">Ask for help, or offer it. Verified members can see and respond to your post.</p>

      <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-line bg-white p-6">
        {formMessage && <p role="alert" className="mb-4 text-sm text-danger">{formMessage}</p>}

        <RadioGroup
          name="type"
          legend="What would you like to do?"
          options={POST_TYPES}
          value={formData.type}
          onChange={handleChange}
          error={errors.type}
        />

        <div className="mb-5">
          <label htmlFor="title" className="block text-sm font-semibold mb-1">Title</label>
          <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className={inputClass('title')} />
          <FieldError message={errors.title} />
        </div>

        <div className="mb-5">
          <label htmlFor="description" className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            className={inputClass('description')}
          />
          <p className="text-xs text-muted mt-1">
            {formData.description.trim().length} / {DESCRIPTION_MAX} characters, at least 20
          </p>
          <FieldError message={errors.description} />
        </div>

        <div className="mb-5">
          <label htmlFor="field" className="block text-sm font-semibold mb-1">Field</label>
          <select id="field" name="field" value={formData.field} onChange={handleChange} className={inputClass('field')}>
            <option value="">Choose a field</option>
            {FIELDS.map((field) => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
          <FieldError message={errors.field} />
        </div>

        <RadioGroup
          name="exchange"
          legend="Exchange"
          options={EXCHANGES}
          value={formData.exchange}
          onChange={handleChange}
          error={errors.exchange}
        />

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand hover:bg-brand-hover text-white font-bold px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {submitting ? 'Publishing' : 'Publish'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/boards')}
            className="border border-line bg-white font-bold px-5 py-2 rounded-lg hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPost;
