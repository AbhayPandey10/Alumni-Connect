import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { UploadCloud, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const ResumeAnalyzerPage = () => {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('targetRole', targetRole);

    try {
      // Set Content-Type to multipart/form-data for file uploads
      const { data } = await axiosInstance.post('/resume/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to analyze resume. Make sure it is a valid PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Resume Analyzer</h1>
        <p className="text-gray-600 mb-8">Upload your resume and get an instant ATS score and feedback tailored to your target role.</p>

        <form onSubmit={handleAnalyze} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Job Role</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. Frontend Developer, Data Analyst"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            />
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition">
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <label className="cursor-pointer text-blue-600 font-medium hover:underline">
              <span>Browse for a PDF</span>
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
            </label>
            <p className="text-sm text-gray-500 mt-1">
              {file ? `Selected: ${file.name}` : 'or drag and drop your resume here'}
            </p>
          </div>

          {error && <div className="bg-red-100 text-red-600 p-3 rounded">{error}</div>}

          <button 
            type="submit" 
            disabled={loading || !file || !targetRole}
            className={`w-full py-3 rounded-md text-white font-bold text-lg flex justify-center items-center transition ${
              loading || !file || !targetRole ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <><Loader2 className="animate-spin mr-2" size={20} /> Analyzing...</>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </form>
      </div>

      {/* RESULTS SECTION */}
      {results && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between border-b pb-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
            <div className={`text-4xl font-black ${results.atsScore >= 80 ? 'text-green-500' : results.atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
              {results.atsScore}/100
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                <AlertTriangle className="text-yellow-500 mr-2" size={20} /> Missing Keywords
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.keywordOptimization?.map((keyword, i) => (
                  <span key={i} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Skill Gap Analysis</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-md border">{results.skillGapAnalysis}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center mb-2">
                <CheckCircle className="text-green-500 mr-2" size={20} /> Actionable Improvements
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                {results.improvementSuggestions?.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalyzerPage;