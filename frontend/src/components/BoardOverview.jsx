import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';

// ALN-21 (R3): what pending members see on the boards. Only counts per field are shown, never
// titles or names (D5), so the network stays verified-only while new members see its value.
const BoardOverview = ({ user }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/overview', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setRows(response.data);
      } catch (err) {
        setError("We couldn't load the overview. Try again in a moment.");
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, [user]);

  const total = rows.reduce((sum, row) => sum + row.requests + row.offers, 0);

  return (
    <div className="max-w-3xl mx-auto mt-10 mb-10 px-4">
      <h1 className="text-2xl font-bold">Boards</h1>
      <p className="text-sm text-muted mt-1 mb-6">
        Here's what verified members are asking for and offering. You can read posts and respond once your
        graduation is verified.
      </p>

      {loading && <p className="text-sm text-muted">Loading the overview</p>}
      {!loading && error && <p role="alert" className="text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <div className="rounded-xl border border-line bg-white p-5">
          {total === 0 ? (
            <p className="text-sm text-muted">There are no open posts yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="pb-2 font-semibold">Field</th>
                  <th className="pb-2 font-semibold text-right">Requests</th>
                  <th className="pb-2 font-semibold text-right">Offers</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.field} className="border-t border-line">
                    <td className="py-2">{row.field}</td>
                    <td className="py-2 text-right">{row.requests}</td>
                    <td className="py-2 text-right">{row.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default BoardOverview;
