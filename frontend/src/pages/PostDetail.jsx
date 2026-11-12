import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { POST_TYPES, EXCHANGES, canUseBoards } from '../postOptions';

// ALN-25 (R10): one post in full. Layout follows wireframe WF2-3.
const PostDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <p className="mt-6 border-t border-line pt-4 text-sm text-muted">This is your post.</p>
          )}
          {post.status === 'closed' && (
            <p className="mt-6 border-t border-line pt-4 text-sm text-muted">This post is closed.</p>
          )}
        </article>
      )}
    </div>
  );
};

export default PostDetail;
