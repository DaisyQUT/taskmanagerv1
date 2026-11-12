import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import VerificationQueue from './pages/VerificationQueue';
import NewPost from './pages/NewPost';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        {/* ALN-27: there is no home page yet, so the root address sends people to log in. */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/admin/verifications" element={<VerificationQueue />} />
        <Route path="/posts/new" element={<NewPost />} />
      </Routes>
    </Router>
  );
}

export default App;