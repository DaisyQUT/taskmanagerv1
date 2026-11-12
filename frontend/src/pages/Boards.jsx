import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosConfig';
import { EXCHANGES, labelFor, canUseBoards } from '../postOptions';

// ALN-25 (R9): Requests and Offers on two tabs, newest first. Layout follows wireframe WF2-2.
// The tab and page live in the address (?type=offer&page=2), so the back button and shared links work.
const TABS = [
  { type: 'request', label: 'Requests', empty: 'No requests yet. Be the first to post.' },
  { type: 'offer', label: 'Offers', empty: 'No offers yet. Be the first to post.' },
];

const Boards = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') === 'offer' ? 'offer' : 'request';
  const page = Number(searchParams.get('page')) || 1;

  const [posts, setPosts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Set by the new post page after publishing.
  const notice = location.state?.notice;

  useEffect(() => {
    if (!canUseBoards(user)) {
      setLoading(false);
      return;
    }

    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get('/api/posts', {
          params: { type, page },
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setPosts(response.data.posts);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError("We couldn't load the board. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, type, page]);

  if (!canUseBoards(user)) {
    return (
      <p className="max-w-3xl mx-auto mt-16 px-4 text-sm text-muted">
        The boards are for verified members. <Link to="/profile" className="text-brand font-semibold underline">Check your status</Link>.
      </p>
    );
  }

  const tab = TABS.find((t) => t.type === type);

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Boards</h1>
          <p className="text-sm text-muted mt-1">Ask for help, or find someone you can help.</p>
        </div>
        <Link to="/posts/new" className="whitespace-nowrap bg-brand hover:bg-brand-hover text-white text-sm font-bold px-4 py-2 rounded-lg">
          + New post
        </Link>
      </div>

      {notice && <p role="status" className="mt-4 text-sm font-semibold text-brand">✓ {notice}</p>}

      <div className="mt-6 mb-4 flex gap-6 border-b border-line text-sm" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.type}
            type="button"
            role="tab"
            aria-selected={t.type === type}
            onClick={() => setSearchParams({ type: t.type })}
            className={`-mb-px pb-2 ${t.type === type ? 'border-b-2 border-brand font-bold text-brand' : 'text-muted hover:text-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-muted">Loading posts</p>}
      {!loading && error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <div className="rounded-xl border border-line bg-white p-8 text-center">
          <p className="font-bold">{tab.empty}</p>
          <Link to="/posts/new" className="mt-2 inline-block text-sm text-brand font-semibold underline">Write a post</Link>
        </div>
      )}

      {!loading && !error && posts.length > 0 && (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post.id}>
              <Link to={`/posts/${post.id}`} className="block rounded-xl border border-line bg-white p-5 hover:border-brand">
                <p className="font-bold">{post.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {post.field} / {labelFor(EXCHANGES, post.exchange)} / {post.authorName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && totalPages > 1 && (
        <nav className="mt-6 flex items-center justify-center gap-4 text-sm" aria-label="Pages">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setSearchParams({ type, page: page - 1 })}
            className="font-semibold text-brand disabled:text-muted disabled:opacity-50"
          >
            ‹ Previous
          </button>
          <span className="text-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setSearchParams({ type, page: page + 1 })}
            className="font-semibold text-brand disabled:text-muted disabled:opacity-50"
          >
            Next ›
          </button>
        </nav>
      )}
    </div>
  );
};

export default Boards;
