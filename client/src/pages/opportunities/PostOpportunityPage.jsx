import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate } from 'react-router-dom';

const PostOpportunityPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    type: 'Full-Time',
    eligibility: '',
    requiredSkills: '',
    deadline: '',
    applicationLink: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        // Convert comma-separated string into an array of skills
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim())
      };

      await axiosInstance.post('/opportunities', payload);
      navigate('/jobs'); // Redirect to the job board after posting
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Post an Opportunity</h2>
      <p className="text-gray-600 mb-8">Share internships, full-time roles, or referral links with the students.</p>
      
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-6">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input 
              type="text" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="e.g. Google, Microsoft, StartupX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
            <input 
              type="text" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g. Frontend Developer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Type</label>
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
            <input 
              type="text" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.eligibility}
              onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
              placeholder="e.g. 2025 Batch only, CGPA > 8.0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (Comma separated)</label>
          <input 
            type="text" required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={formData.requiredSkills}
            onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
            placeholder="React, Node.js, System Design"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
            <input 
              type="date" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Application Link</label>
            <input 
              type="url" required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={formData.applicationLink}
              onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
              placeholder="https://careers.company.com/job"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-3 rounded-md text-white font-bold text-lg transition duration-200 ${
            loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Posting...' : 'Post Opportunity'}
        </button>
      </form>
    </div>
  );
};

export default PostOpportunityPage;