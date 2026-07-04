import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import StudentProfileSetup from './pages/onboarding/StudentProfileSetup';
import AlumniProfileSetup from './pages/onboarding/AlumniProfileSetup';
import OpportunityListPage from './pages/opportunities/OpportunityListPage';
import PostOpportunityPage from './pages/opportunities/PostOpportunityPage';
import EditOpportunityPage from './pages/opportunities/EditOpportunityPage';
import ResumeAnalyzerPage from './pages/resume/ResumeAnalyzerPage';
import ResumeBuilderPage from './pages/resume/ResumeBuilderPage';
import LeaderboardWidget from './components/LeaderboardWidget';

//Dashboard
const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="max-w-4xl mx-auto mt-10 p-8 bg-white shadow rounded">
      <h1 className="text-3xl font-bold mb-4">Welcome, {user?.email}</h1>
      <p className="text-lg text-gray-600 mb-8">Role: <span className="font-semibold text-blue-600">{user?.role}</span></p>
      
      <div className="flex flex-wrap gap-4">
        {user?.role === 'Student' ? (
          <>
            <Link to="/setup-student" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition">Setup Profile</Link>
            <Link to="/resume-analyzer" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded transition">Analyze Resume</Link>
            <Link to="/build-resume" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded transition">Build Resume</Link>
          </>) : (
          <Link to="/setup-alumni" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition">Setup Profile</Link>
        )}
        
        <Link to="/jobs" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition">View Board</Link>
        
        {/* Only Alumni see this button */}
        {user?.role === 'Alumni' && (
          <Link to="/post-job" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition">Post an Opportunity</Link>
        )}
        
        <button onClick={logout} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded transition">Logout</button>
      </div>
      <LeaderboardWidget />
    </div>
  );
};

const AppRoutes = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="p-4 bg-white shadow-sm flex justify-between px-8">
        <h1 className="text-xl font-bold text-blue-600 tracking-tight">AlumniConnect</h1>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/setup-student" element={<StudentProfileSetup />} />
          <Route path="/setup-alumni" element={<AlumniProfileSetup />} />
          <Route path="/jobs" element={<OpportunityListPage />} />
          <Route path="/post-job" element={<PostOpportunityPage />} />
          <Route path="/edit-job/:id" element={<EditOpportunityPage />} />
          <Route path="/resume-analyzer" element={<ResumeAnalyzerPage />} />
          <Route path="/build-resume" element={<ResumeBuilderPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;