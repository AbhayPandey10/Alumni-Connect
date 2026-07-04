import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Trophy, Medal, Award } from 'lucide-react';

const LeaderboardWidget = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await axiosInstance.get('/leaderboard');
        setLeaders(data);
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) return <div className="animate-pulse h-32 bg-gray-200 rounded-xl mt-8"></div>;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-blue-800 rounded-xl shadow-lg p-6 mt-10 text-white">
      <div className="flex items-center mb-6 border-b border-indigo-700 pb-4">
        <Trophy className="text-yellow-400 mr-3" size={28} />
        <h2 className="text-2xl font-bold">Top Alumni Contributors</h2>
      </div>
      
      {leaders.length === 0 ? (
        <p className="text-indigo-200 italic">No contributions yet. Be the first to top the board!</p>
      ) : (
        <div className="space-y-4">
          {leaders.map((leader, index) => (
            <div key={leader._id._id} className="flex justify-between items-center bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <div className="flex items-center">
                {/* Dynamically render Gold, Silver, Bronze icons for top 3 */}
                {index === 0 && <Medal className="text-yellow-400 mr-3" size={24} />}
                {index === 1 && <Medal className="text-gray-300 mr-3" size={24} />}
                {index === 2 && <Medal className="text-amber-600 mr-3" size={24} />}
                {index > 2 && <Award className="text-indigo-300 mr-3" size={24} />}
                
                <span className="font-semibold">{leader._id.email.split('@')[0]}</span>
              </div>
              <div className="bg-white text-indigo-900 px-3 py-1 rounded-full text-sm font-black shadow">
                {leader.score} {leader.score === 1 ? 'Job' : 'Jobs'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;