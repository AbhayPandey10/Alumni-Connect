import { createContext, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const finishAuth = (data) => {
    setUser(data);
    localStorage.setItem('userInfo', JSON.stringify(data));
    navigate('/dashboard');
  };

  const login = async (email, password) => {
    try {
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      if (data.verificationRequired) {
        navigate('/verify', { state: { email: data.email } });
        return;
      }
      finishAuth(data);
    } catch (error) {
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const register = async (firstName, lastName, username, email, password, graduationYear) => {
    try {
      const { data } = await axiosInstance.post('/auth/register', {
        firstName, lastName, username, email, password, graduationYear
      });
      if (data.verificationRequired) {
        navigate('/verify', { state: { email: data.email } });
        return;
      }
      finishAuth(data);
    } catch (error) {
      throw error.response?.data?.message || 'Registration failed';
    }
  };

  const verifyOtp = async (email, code) => {
    try {
      const { data } = await axiosInstance.post('/auth/verify-otp', { email, code });
      finishAuth(data);
    } catch (error) {
      throw error.response?.data?.message || 'Verification failed';
    }
  };

  const resendOtp = async (email) => {
    try {
      await axiosInstance.post('/auth/resend-otp', { email });
    } catch (error) {
      throw error.response?.data?.message || 'Could not resend code';
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const googleLogin = async (googleToken, graduationYear = null, username = null) => {
    try {
      const { data } = await axiosInstance.post('/auth/google', {
        token: googleToken,
        graduationYear,
        username
      });
      finishAuth(data);
    } catch (error) {
      throw error.response?.data?.message || 'Google Authentication failed';
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, googleLogin, verifyOtp, resendOtp, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};