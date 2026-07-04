import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useNavigate, useLocation } from 'react-router-dom';

const EditOpportunityPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const existingJob = location.state?.opp; 

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pre-fill state with existing job data
  const [formData, setFormData] = useState({
    company: existingJob?.company || '',
    role: existingJob?.role || '',
    type: existingJob?.type || 'Full-Time',
    eligibility: existingJob?.eligibility || '',
    requiredSkills: existingJob?.requiredSkills?.join(', ') || '', // Convert array back to string
    deadline: existingJob?.deadline ? new Date(existingJob.deadline).toISOString().split('T')[0] : '',
    applicationLink: existingJob?.applicationLink || ''
  });

  if (!existingJob) {
    navigate('/jobs');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(skill => skill.trim())
      };

      await axiosInstance.put(`/opportunities/${existingJob._id}`, payload);
      navigate('/jobs'); 
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update opportunity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Edit Opportunity</h2>
      
      {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-6">{error}</div>}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-md" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Role</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-md" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Type</label>
            <select className="w-full px-3 py-2 border rounded-md" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              <option value="Full-Time">Full-Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Eligibility</label>
            <input type="text" required className="w-full px-3 py-2 border rounded-md" value={formData.eligibility} onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (Comma separated)</label>
          <input type="text" required className="w-full px-3 py-2 border rounded-md" value={formData.requiredSkills} onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
            <input type="date" required className="w-full px-3 py-2 border rounded-md" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Official Application Link</label>
            <input type="url" required className="w-full px-3 py-2 border rounded-md" value={formData.applicationLink} onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700">
          {loading ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditOpportunityPage;