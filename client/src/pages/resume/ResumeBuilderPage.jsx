import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Save, Download, Plus, Trash2, FileText, Loader2 } from 'lucide-react';

const ResumeBuilderPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    contact: { fullName: '', email: '', phone: '', linkedin: '' },
    skills: '',
    experience: [{ company: '', role: '', duration: '', description: '' }],
    projects: [{ title: '', techStack: '', description: '' }],
    education: [{ institution: '', degree: '', year: '', gpa: '' }]
  });

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const { data } = await axiosInstance.get('/resume-builder/draft');
        if (data && Object.keys(data).length > 0) {
          // Merge fetched data with default structure to avoid undefined errors
          setFormData(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching draft:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, []);

  // Helpers for nested state and arrays
  const handleContactChange = (field, value) => {
    setFormData({ ...formData, contact: { ...formData.contact, [field]: value } });
  };

  const handleArrayChange = (section, index, field, value) => {
    const newArray = [...formData[section]];
    newArray[index][field] = value;
    setFormData({ ...formData, [section]: newArray });
  };

  const addArrayItem = (section, emptyObject) => {
    setFormData({ ...formData, [section]: [...formData[section], emptyObject] });
  };

  const removeArrayItem = (section, index) => {
    const newArray = formData[section].filter((_, i) => i !== index);
    setFormData({ ...formData, [section]: newArray });
  };

  const isLastItemEmpty = (section) => {
    const array = formData[section];
    if (!array || array.length === 0) return false; 
    
    const lastItem = array[array.length - 1];
    
    // Loop through all keys in the card
    for (const key in lastItem) {
        if (key !== '_id') {
          if (lastItem[key] && String(lastItem[key]).trim() !== '') {
              return false; 
          }
        }
    }
    return true; 
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axiosInstance.post('/resume-builder/draft', formData);
      setMessage('Draft saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    setMessage('');
    try {
      await axiosInstance.post('/resume-builder/draft', formData);
      
      const response = await axiosInstance.post('/resume-builder/export', {}, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${formData.contact.fullName.replace(/\s+/g, '_') || 'My'}_Resume.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setMessage('PDF downloaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage('Failed to export PDF.');
    } finally {
      setExporting(false);
    }
  };


  const handleClearForm = () => {
    const confirmClear = window.confirm("Are you sure you want to clear the entire form? This cannot be undone.");
    if (confirmClear) {
        setFormData({
        contact: { fullName: '', email: '', phone: '', linkedin: '' },
        skills: '',
        experience: [],
        projects: [],
        education: []
        });
        setMessage('Form cleared. You can start fresh!');
        setTimeout(() => setMessage(''), 3000);
    }
    };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading your draft...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 pb-20">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="mr-3 text-blue-600" size={32} /> Resume Builder
          </h1>
          <p className="text-gray-600 mt-1">Fill out the details below and generate a clean, ATS-friendly PDF.</p>
        </div>
        <div className="flex space-x-3">
            <button 
                onClick={handleClearForm} 
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 font-semibold rounded hover:bg-red-200 transition">
                <Trash2 size={18} className="mr-2" />
                Start Fresh
            </button>
            <button onClick={handleSaveDraft} disabled={saving} className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded hover:bg-gray-300 transition">
                {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                Save Draft
            </button>
            <button onClick={handleExportPDF} disabled={exporting} className="flex items-center px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition shadow-sm">
                {exporting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Download size={18} className="mr-2" />}
                Export PDF
            </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 mb-6 rounded-md font-medium text-center ${message.includes('Failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* CONTACT SECTION */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name" className="border p-2 rounded" value={formData.contact.fullName} onChange={(e) => handleContactChange('fullName', e.target.value)} />
            <input type="email" placeholder="Email Address" className="border p-2 rounded" value={formData.contact.email} onChange={(e) => handleContactChange('email', e.target.value)} />
            <input type="text" placeholder="Phone Number" className="border p-2 rounded" value={formData.contact.phone} onChange={(e) => handleContactChange('phone', e.target.value)} />
            <input type="text" placeholder="LinkedIn URL" className="border p-2 rounded" value={formData.contact.linkedin} onChange={(e) => handleContactChange('linkedin', e.target.value)} />
          </div>
        </section>

        {/* SKILLS SECTION */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Skills</h2>
          <textarea placeholder="e.g. JavaScript, React, Node.js, Project Management (Comma separated)" className="w-full border p-2 rounded h-20" value={formData.skills} onChange={(e) => setFormData({...formData, skills: e.target.value})} />
        </section>

        {/* EXPERIENCE SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Experience</h2>
            <button 
                onClick={() => addArrayItem('experience', { company: '', role: '', duration: '', description: '' })} 
                disabled={isLastItemEmpty('experience')}
                className={`font-medium flex items-center text-sm transition ${isLastItemEmpty('experience') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                >
                <Plus size={16} className="mr-1" /> Add Job
            </button>
          </div>
          {formData.experience.map((exp, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100 relative group">
              <button onClick={() => removeArrayItem('experience', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 pr-8">
                <input type="text" placeholder="Company" className="border p-2 rounded" value={exp.company} onChange={(e) => handleArrayChange('experience', index, 'company', e.target.value)} />
                <input type="text" placeholder="Role" className="border p-2 rounded" value={exp.role} onChange={(e) => handleArrayChange('experience', index, 'role', e.target.value)} />
                <input type="text" placeholder="Duration (e.g. Jan 2024 - Present)" className="border p-2 rounded" value={exp.duration} onChange={(e) => handleArrayChange('experience', index, 'duration', e.target.value)} />
              </div>
              <textarea placeholder="Describe your responsibilities and achievements..." className="w-full border p-2 rounded h-20" value={exp.description} onChange={(e) => handleArrayChange('experience', index, 'description', e.target.value)} />
            </div>
          ))}
        </section>

        {/* PROJECTS SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Projects</h2>
            <button 
                onClick={() => addArrayItem('projects', { title: '', techStack: '', description: '' })} 
                disabled={isLastItemEmpty('projects')}
                className={`font-medium flex items-center text-sm transition ${isLastItemEmpty('projects') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                >
                <Plus size={16} className="mr-1" /> Add Project
            </button>
          </div>
          {formData.projects.map((proj, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100 relative group">
              <button onClick={() => removeArrayItem('projects', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3 pr-8">
                <input type="text" placeholder="Project Title" className="border p-2 rounded" value={proj.title} onChange={(e) => handleArrayChange('projects', index, 'title', e.target.value)} />
                <input type="text" placeholder="Tech Stack (e.g. React, MongoDB)" className="border p-2 rounded" value={proj.techStack} onChange={(e) => handleArrayChange('projects', index, 'techStack', e.target.value)} />
              </div>
              <textarea placeholder="What did you build?" className="w-full border p-2 rounded h-20" value={proj.description} onChange={(e) => handleArrayChange('projects', index, 'description', e.target.value)} />
            </div>
          ))}
        </section>

        {/* EDUCATION SECTION */}
        <section>
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">Education</h2>
            <button 
                onClick={() => addArrayItem('education', { institution: '', degree: '', year: '', gpa: '' })} 
                disabled={isLastItemEmpty('education')}
                className={`font-medium flex items-center text-sm transition ${isLastItemEmpty('education') ? 'text-gray-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                >
                <Plus size={16} className="mr-1" /> Add Education
            </button>
          </div>
          {formData.education.map((edu, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100 relative group">
              <button onClick={() => removeArrayItem('education', index)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                <input type="text" placeholder="Institution" className="border p-2 rounded" value={edu.institution} onChange={(e) => handleArrayChange('education', index, 'institution', e.target.value)} />
                <input type="text" placeholder="Degree (e.g. B.Tech Computer Science)" className="border p-2 rounded" value={edu.degree} onChange={(e) => handleArrayChange('education', index, 'degree', e.target.value)} />
                <input type="text" placeholder="Graduation Year" className="border p-2 rounded" value={edu.year} onChange={(e) => handleArrayChange('education', index, 'year', e.target.value)} />
                <input type="text" placeholder="GPA / Grade" className="border p-2 rounded" value={edu.gpa} onChange={(e) => handleArrayChange('education', index, 'gpa', e.target.value)} />
              </div>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
};

export default ResumeBuilderPage;