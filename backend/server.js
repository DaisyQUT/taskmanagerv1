const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/responses', require('./routes/responseRoutes'));

// ALN-13: on EC2, Express also serves the built React app, so the app and the API share one address.
// Any path that isn't an API route gets index.html and React Router takes over from there.
const buildPath = path.join(__dirname, '..', 'frontend', 'build');
app.use(express.static(buildPath));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(buildPath, 'index.html'));
});

// Only connect to the database and start listening when this file is run directly.
// Tests import the app without starting a server.
if (require.main === module) {
    connectDB();
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;