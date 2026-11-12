import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { POST_TYPES, EXCHANGES, canUseBoards } from '../postOptions';

// ALN-25 (R10): one post in full. Layout follows wireframe WF2-3.
// ALN-19 (R11): other members can respond once; after that they see their own response instead.
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 300;

const formatDate = (value) =>
  new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

const RESPONSE_STATUS = {
  pending: "The author hasn't decided yet.",
  accepted: 'The author accepted your response.',
  declined: 'The author declined your response.',
};
const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canUseBoards(user)) {
      setLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        const response = await axiosInstance.get(`/api/posts/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPost(response.data);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? "We couldn't find that post. It may have been removed."
            : "We couldn't load this post. Try again in a moment."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [user, id]);

  if (!canUseBoards(user)) {
    return (
      <p className="max-w-2xl mx-auto mt-16 px-4 text-sm text-muted">
        The boards are for verified members. <Link to="/profile" className="text-brand font-semibold underline">Check your status</Link>.
      </p>
    );
  }

  const boardType = post?.type || 'request';

  const sendResponse = async (e) => {
    e.preventDefault();
    const length = message.trim().length;
    if (length < MESSAGE_MIN || length > MESSAGE_MAX) {
      setMessageError(`Your message must be ${MESSAGE_MIN} to ${MESSAGE_MAX} characters.`);
      return;
    }

    setSending(true);
    setMessageError('');
    try {
      await axiosInstance.post(`/api/posts/${id}/responses`, { message }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate(`/boards?type=${boardType}`, { state: { notice: 'Your response is sent.' } });
    } catch (err) {
      setMessageError(err.response?.data?.errors?.message || err.response?.data?.message || "We couldn't send your response. Try again in a moment.");
    } finally {
      setSending(false);
    }
  };

  // Members can respond to someone else's open post if they haven't already.
  const canRespond = post && !post.isOwner && post.status === 'open' && !post.myResponse;

  return (
    <div className="max-w-2xl mx-auto mt-10 mb-10 px-4">
      <Link to={`/boards?type=${boardType}`} className="text-sm text-muted hover:text-ink">← Back to boards</Link>

      {loading && <p className="mt-6 text-sm text-muted">Loading post</p>}
      {!loading && error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}

      {post && (
        <article className="mt-4 rounded-xl border border-line bg-white p-6">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {POST_TYPES.find((t) => t.value === post.type)?.boardLabel} · {post.field} ·{' '}
            {EXCHANGES.find((e) => e.value === post.exchange)?.label} · Posted by {post.authorName}
          </p>
          <p className="mt-5 whitespace-pre-line leading-relaxed">{post.description}</p>

          {post.isOwner && (
            <p className="mt-6 border-t border-line pt-4 text-sm text-muted">
              This is your post. See its responses in{' '}
              <Link to="/my-posts" className="text-brand font-semibold underline">My posts</Link>.
            </p>
          )}
          {post.status === 'closed' && !post.isOwner && (
            <p className="mt-6 border-t border-line pt-4 text-sm text-muted">This post is closed.</p>
          )}

          {post.myResponse && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="text-sm font-bold">You responded on {formatDate(post.myResponse.createdAt)}</p>
              <p className="mt-1 text-sm text-muted">“{post.myResponse.message}”</p>
              <p className="mt-2 text-sm">{RESPONSE_STATUS[post.myResponse.status]}</p>
              {post.myResponse.authorEmail && (
                <p className="mt-1 text-sm font-semibold text-brand">
                  Contact {post.authorName} at{' '}
                  <a href={`mailto:${post.myResponse.authorEmail}`} className="underline">{post.myResponse.authorEmail}</a>
                </p>
              )}
            </div>
          )}

          {canRespond && (
            <form onSubmit={sendResponse} noValidate className="mt-6 border-t border-line pt-4">
              <label htmlFor="message" className="block font-bold">Respond</label>
              <p className="text-sm text-muted mb-2">
                Say how you can help, or what you'd like to know. The author sees your name and message.
              </p>
              <textarea
                id="message"
                rows={4}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setMessageError('');
                }}
                className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  messageError ? 'border-danger focus:ring-danger/20' : 'border-line focus:border-brand focus:ring-brand/20'
                }`}
              />
              <p className="text-xs text-muted mt-1">
                {message.trim().length} / {MESSAGE_MAX} characters, at least {MESSAGE_MIN}
              </p>
              {messageError && <p role="alert" className="mt-1 text-sm text-danger">{messageError}</p>}
              <button
                type="submit"
                disabled={sending}
                className="mt-3 bg-brand hover:bg-brand-hover text-white font-bold px-5 py-2 rounded-lg disabled:opacity-50"
              >
                {sending ? 'Sending' : 'Send response'}
              </button>
            </form>
          )}
        </article>
      )}
    </div>
  );
};

export default PostDetail;
