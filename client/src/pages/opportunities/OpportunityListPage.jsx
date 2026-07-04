import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Building, Calendar, Link as LinkIcon, Edit, MessageSquare, Loader2 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OpportunityListPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const { data } = await axiosInstance.get('/opportunities');
        setOpportunities(data);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOpportunities();
  }, []);

  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setMessage(''); // Start with a blank slate for custom writing
    setShowModal(true);
  };

  const generateAIReferral = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        studentDetails: `A student at NIT Jamshedpur (${user.email})`,
        alumniDetails: `An alumni working at ${selectedJob.company}`,
        opportunityDetails: `${selectedJob.role} role`
      };

      const { data } = await axiosInstance.post('/resume/generate-message', payload);
      setMessage(data.generatedMessage); // Auto-fills the textbox
    } catch (error) {
      console.error("AI Generation Error:", error);
      setMessage("Failed to generate message. Please try again or write your own.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading opportunities...</div>;

  return (
    <div className="max-w-6xl mx-auto mt-8 px-4 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Referral Board</h1>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow text-gray-500">
          No opportunities posted yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.map((opp) => (
            <div key={opp._id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{opp.role}</h3>
                    <div className="flex items-center text-blue-600 mt-1">
                      <Building size={16} className="mr-1" />
                      <span className="font-medium">{opp.company}</span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {opp.type}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  <p><strong>Eligibility:</strong> {opp.eligibility}</p>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>Deadline: {new Date(opp.deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div>
                {/* Request Referral Button (For Students Only) */}
                {user?.role === 'Student' && (
                (() => {
                    // Check if the current user's ID is in the requestedBy array
                    const hasRequested = opp.requestedBy?.includes(user._id || user.id);
                    
                    return hasRequested ? (
                    <button 
                        disabled
                        className="w-full mt-4 flex justify-center items-center py-2 bg-green-100 text-green-800 font-bold rounded cursor-not-allowed transition"
                    >
                        ✓ Request Sent
                    </button>
                    ) : (
                    <button 
                        onClick={() => handleOpenModal(opp)}
                        className="w-full mt-4 flex justify-center items-center py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
                    >
                        <MessageSquare size={16} className="mr-2" />
                        Request Referral
                    </button>
                    );
                })()
                )}

                {user?._id === (opp.postedBy?._id || opp.postedBy) && (
                  <button 
                    onClick={() => navigate(`/edit-job/${opp._id}`, { state: { opp } })}
                    className="w-full mt-4 flex justify-center items-center py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Post
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request a Referral</h2>
            <p className="text-gray-600 mb-6 text-sm">
              Applying for <strong>{selectedJob?.role}</strong> at <strong>{selectedJob?.company}</strong>.
            </p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="block text-sm font-medium text-gray-700">Your Message</label>
                <button 
                  onClick={generateAIReferral}
                  disabled={isGenerating}
                  className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 font-semibold rounded hover:bg-purple-200 transition flex items-center"
                >
                  {isGenerating ? (
                    <><Loader2 size={14} className="animate-spin mr-2" /> Drafting...</>
                  ) : (
                    '✨ Auto-draft with AI'
                  )}
                </button>
              </div>
              
              <textarea 
                className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Write your custom message here, or click the AI button above to generate a professional template..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />

              <button 
                disabled={!message.trim() || isGenerating}
                className={`w-full mt-3 py-3 font-bold rounded transition ${
                    !message.trim() ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={async () => {
                    setIsGenerating(true);
                    try {
                    await axiosInstance.post(`/opportunities/${selectedJob._id}/request`, { message });
                    
                    // Update local state instantly so the button turns green without a refresh
                    setOpportunities(opportunities.map(o => 
                        o._id === selectedJob._id 
                        ? { ...o, requestedBy: [...(o.requestedBy || []), user._id || user.id] } 
                        : o
                    ));
                    
                    setShowModal(false);
                    } catch (err) {
                    alert(err.response?.data?.message || "Failed to send request.");
                    } finally {
                    setIsGenerating(false);
                    }
                }}
                >
                Send Request
                </button>
            </div>

            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpportunityListPage;