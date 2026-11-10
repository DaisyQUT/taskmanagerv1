import axios from 'axios';

// ALN-13: in production the API is served from the same address as the app, so a relative URL keeps
// working when the EC2 public IP changes. In development the API runs separately on port 5001.
const baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001';

const axiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

export default axiosInstance;