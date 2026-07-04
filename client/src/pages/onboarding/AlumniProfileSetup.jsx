import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AlumniProfileSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    company: '', jobRole: '', industry: '', experienceYears: '', skills: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        experienceYears: Number(formData.experienceYears),
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
      <h2 className="text-2xl font-bold text-blue-600 mb-2">Complete Your Alumni Profile</h2>
      <p className="text-gray-600 mb-6">Help students discover your expertise and request referrals.</p>
      
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company</label>
            <input 
              type="text" required className="mt-1 block w-full px-3 py-2 border rounded"
              value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Job Role</label>
            <input 
              type="text" required className="mt-1 block w-full px-3 py-2 border rounded"
              value={formData.jobRole} onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Industry</label>
            <input 
              type="text" required className="mt-1 block w-full px-3 py-2 border rounded"
              placeholder="e.g. Fintech, E-commerce"
              value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
            <input 
              type="number" required className="mt-1 block w-full px-3 py-2 border rounded"
              value={formData.experienceYears} onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Skills & Tech Stack (Comma separated)</label>
          <input 
            type="text" required className="mt-1 block w-full px-3 py-2 border rounded"
            placeholder="AWS, System Design, Java, Spring Boot"
            value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
          Save Profile & Go to Dashboard
        </button>
      </form>
    </div>
  );
};

export default AlumniProfileSetup;