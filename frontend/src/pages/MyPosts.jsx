import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { POST_TYPES, canUseBoards } from '../postOptions';

// ALN-20 (R12): authors see the responses to each of their posts and accept or decline them.
// Accepting shares both emails, so the two members can arrange the exchange themselves.
// Layout follows wireframe WF2-4.
const typeLabel = (type) => POST_TYPES.find((t) => t.value === type)?.boardLabel;

const ResponseItem = ({ response, onDecide, saving }) => (
  <li className="border-t border-line pt-4 mt-4">
    <p className="font-bold">{response.responderName}</p>
    <p className="mt-1 text-sm text-muted">“{response.message}”</p>

    {response.status === 'pending' && (
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => onDecide(response, 'accept')}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-50"
        >
          Accept
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => onDecide(response, 'decline')}
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-bold hover:bg-surface disabled:opacity-50"
        >
          Decline
        </button>
      </div>
    )}

    {response.status === 'accepted' && (
      <p className="mt-2 text-sm font-semibold text-brand">
        ✓ Accepted · <a href={`mailto:${response.contactEmail}`} className="underline">{response.contactEmail}</a>
      </p>
    )}

    {response.status === 'declined' && <p className="mt-2 text-sm text-muted">Declined</p>}
  </li>
);

const MyPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canUseBoards(user)) {
      setLoading(false);
      return;
    }

    const fetchMyPosts = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/mine', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPosts(response.data);
      } catch (err) {
        setError("We couldn't load your posts. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyPosts();
  }, [user]);

  // Update one response in place, so the page doesn't need to reload.
  const replaceResponse = (updated) => {
    setPosts(
      posts.map((post) => ({
        ...post,
        responses: post.responses.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
      }))
    );
  };

  const decide = async (response, action) => {
    if (
      action === 'accept' &&
      !window.confirm(`Accept ${response.responderName}'s response? You'll both see each other's email.`)
    ) {
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');
    try {
      const result = await axiosInstance.patch(`/api/responses/${response.id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      replaceResponse(result.data);
      setNotice(
        action === 'accept'
          ? `You accepted ${response.responderName}. You can now contact each other by email.`
          : `You declined ${response.responderName}'s response.`
      );
    } catch (err) {
      setError(err.response?.data?.message || "We couldn't save that decision. Try again in a moment.");
    } finally {
      setSaving(false);
    }
  };

  if (!canUseBoards(user)) {
    return (
      <p className="max-w-3xl mx-auto mt-16 px-4 text-sm text-muted">
        The boards are for verified members. <Link to="/profile" className="text-brand font-semibold underline">Check your status</Link>.
      </p>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold">My posts</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Responses to your posts. When you accept one, you'll both see each other's email.
      </p>

      {notice && <p role="status" className="mb-4 text-sm font-semibold text-brand">✓ {notice}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
      {loading && <p className="text-sm text-muted">Loading your posts</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-8 text-center">
          <p className="font-bold">You haven't posted yet.</p>
          <Link to="/posts/new" className="mt-2 inline-block text-sm text-brand font-semibold underline">Write a post</Link>
        </div>
      )}

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="rounded-xl border border-line bg-white p-5">
            <Link to={`/posts/${post.id}`} className="font-bold hover:underline">{post.title}</Link>
            <p className="mt-1 text-sm text-muted">
              {typeLabel(post.type)} · {post.responses.length} {post.responses.length === 1 ? 'response' : 'responses'}
            </p>

            {post.responses.length === 0 ? (
              <p className="mt-4 border-t border-line pt-4 text-sm text-muted">Nobody has responded yet.</p>
            ) : (
              <ul>
                {post.responses.map((response) => (
                  <ResponseItem key={response.id} response={response} onDecide={decide} saving={saving} />
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MyPosts;
