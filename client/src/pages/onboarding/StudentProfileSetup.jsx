import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const StudentProfileSetup = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ department: '', skills: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert comma-separated skills into an array
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim())
      };
      await axiosInstance.post('/profiles', payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-blue-600 mb-2">Complete Your Student Profile</h2>
      <p className="text-gray-600 mb-6">Let alumni know what you're studying and what you can build.</p>
      
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Department / Major</label>
          <input 
            type="text" required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="e.g. Computer Science"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Top Skills (Comma separated)</label>
          <input 
            type="text" required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded"
            placeholder="React, Node.js, Python, Data Structures"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
          Save Profile & Go to Dashboard
        </button>
      </form>
    </div>
  );
};

export default StudentProfileSetup;