import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Tasks from './pages/Tasks';
import VerificationQueue from './pages/VerificationQueue';
import NewPost from './pages/NewPost';
import Boards from './pages/Boards';
import PostDetail from './pages/PostDetail';
import MyPosts from './pages/MyPosts';

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
        <Route path="/boards" element={<Boards />} />
        <Route path="/posts/new" element={<NewPost />} />
        <Route path="/posts/:id" element={<PostDetail />} />
        <Route path="/my-posts" element={<MyPosts />} />
      </Routes>
    </Router>
  );
}

export default App;