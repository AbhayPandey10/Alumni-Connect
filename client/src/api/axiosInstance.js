import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', 
});

// Automatically attach the token to every request
axiosInstance.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('userInfo');
  if (storedUser) {
    const { token } = JSON.parse(storedUser);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;