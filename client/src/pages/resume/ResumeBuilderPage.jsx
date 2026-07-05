import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Save, Download, Plus, Trash2, FileText, Loader2 } from 'lucide-react';

const ArraySection = ({ title, section, items, columns, fields, textareas, onAdd, onRemove, onChange, disableAdd }) => (
  <section className="border-t border-line pt-8">
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      <button
        onClick={onAdd}
        disabled={disableAdd}
        className={`btn-ghost px-3 py-1.5 text-xs ${disableAdd ? 'cursor-not-allowed opacity-40' : ''}`}
      >
        <Plus size={14} /> Add
      </button>
    </div>
    {items.map((item, index) => (
      <div key={index} className="group relative mb-4 rounded-xl border border-line bg-paper-2 p-5">
        <button onClick={() => onRemove(index)} className="absolute right-4 top-4 text-muted opacity-0 transition-all hover:text-ink group-hover:opacity-100">
          <Trash2 size={16} />
        </button>
        <div className={`grid grid-cols-1 gap-4 pr-8 ${columns === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {fields.map((f) => (
            <input key={f.key} type="text" placeholder={f.placeholder} className="field" value={item[f.key] || ''} onChange={(e) => onChange(section, index, f.key, e.target.value)} />
          ))}
        </div>
        {textareas?.map((t) => (
          <textarea key={t.key} placeholder={t.placeholder} className="field mt-4 h-20 resize-none" value={item[t.key] || ''} onChange={(e) => onChange(section, index, t.key, e.target.value)} />
        ))}
      </div>
    ))}
  </section>
);

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
    education: [{ institution: '', degree: '', year: '', gpa: '' }],
  });

  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const { data } = await axiosInstance.get('/resume-builder/draft');
        if (data && Object.keys(data).length > 0) {
          setFormData((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Error fetching draft:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDraft();
  }, []);

  const handleContactChange = (field, value) => setFormData({ ...formData, contact: { ...formData.contact, [field]: value } });

  const handleArrayChange = (section, index, field, value) => {
    const newArray = [...formData[section]];
    newArray[index][field] = value;
    setFormData({ ...formData, [section]: newArray });
  };

  const addArrayItem = (section, emptyObject) => setFormData({ ...formData, [section]: [...formData[section], emptyObject] });

  const removeArrayItem = (section, index) => setFormData({ ...formData, [section]: formData[section].filter((_, i) => i !== index) });

  const isLastItemEmpty = (section) => {
    const array = formData[section];
    if (!array || array.length === 0) return false;
    const lastItem = array[array.length - 1];
    for (const key in lastItem) {
      if (key !== '_id' && lastItem[key] && String(lastItem[key]).trim() !== '') return false;
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
    if (window.confirm('Are you sure you want to clear the entire form? This cannot be undone.')) {
      setFormData({
        contact: { fullName: '', email: '', phone: '', linkedin: '' },
        skills: '', experience: [], projects: [], education: [],
      });
      setMessage('Form cleared. You can start fresh!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin text-ink" size={32} /></div>;

  return (
    <div className="shell max-w-5xl py-14">
      <header className="animate-fade-up flex flex-col gap-6 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow"><span className="h-1 w-1 rounded-full bg-ink" /> Resume builder</div>
          <h1 className="display mt-5 flex items-center gap-3 text-4xl md:text-5xl">
            <FileText size={30} strokeWidth={1.6} /> Resume builder
          </h1>
          <p className="mt-3 text-sm text-muted">Compose your details and export a clean, ATS-friendly document.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleClearForm} className="btn-ghost"><Trash2 size={15} /> Start fresh</button>
          <button onClick={handleSaveDraft} disabled={saving} className="btn-secondary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save draft
          </button>
          <button onClick={handleExportPDF} disabled={exporting} className="btn-primary">
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export PDF
          </button>
        </div>
      </header>

      {message && (
        <div className="animate-fade-up mt-6 rounded-lg border border-line bg-paper-2 px-4 py-3 text-center text-sm font-medium text-ink">
          {message}
        </div>
      )}

      <div className="animate-fade-up mt-6 card space-y-10 p-8">
        {/* Contact */}
        <section>
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Contact information</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input type="text" placeholder="Full name" className="field" value={formData.contact.fullName} onChange={(e) => handleContactChange('fullName', e.target.value)} />
            <input type="email" placeholder="Email address" className="field" value={formData.contact.email} onChange={(e) => handleContactChange('email', e.target.value)} />
            <input type="text" placeholder="Phone number" className="field" value={formData.contact.phone} onChange={(e) => handleContactChange('phone', e.target.value)} />
            <input type="text" placeholder="LinkedIn URL" className="field" value={formData.contact.linkedin} onChange={(e) => handleContactChange('linkedin', e.target.value)} />
          </div>
        </section>

        {/* Skills */}
        <section className="border-t border-line pt-8">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Skills</h2>
          <textarea placeholder="e.g. JavaScript, React, Node.js, Project Management (comma separated)" className="field h-20 resize-none" value={formData.skills} onChange={(e) => setFormData({ ...formData, skills: e.target.value })} />
        </section>

        <ArraySection
          title="Experience" section="experience" items={formData.experience} columns={3}
          fields={[
            { key: 'company', placeholder: 'Company' },
            { key: 'role', placeholder: 'Role' },
            { key: 'duration', placeholder: 'Duration (e.g. Jan 2024 – Present)' },
          ]}
          textareas={[{ key: 'description', placeholder: 'Describe your responsibilities and achievements…' }]}
          onAdd={() => addArrayItem('experience', { company: '', role: '', duration: '', description: '' })}
          onRemove={(i) => removeArrayItem('experience', i)} onChange={handleArrayChange}
          disableAdd={isLastItemEmpty('experience')}
        />

        <ArraySection
          title="Projects" section="projects" items={formData.projects} columns={2}
          fields={[
            { key: 'title', placeholder: 'Project title' },
            { key: 'techStack', placeholder: 'Tech stack (e.g. React, MongoDB)' },
          ]}
          textareas={[{ key: 'description', placeholder: 'What did you build?' }]}
          onAdd={() => addArrayItem('projects', { title: '', techStack: '', description: '' })}
          onRemove={(i) => removeArrayItem('projects', i)} onChange={handleArrayChange}
          disableAdd={isLastItemEmpty('projects')}
        />

        <ArraySection
          title="Education" section="education" items={formData.education} columns={2}
          fields={[
            { key: 'institution', placeholder: 'Institution' },
            { key: 'degree', placeholder: 'Degree (e.g. B.Tech Computer Science)' },
            { key: 'year', placeholder: 'Graduation year' },
            { key: 'gpa', placeholder: 'GPA / grade' },
          ]}
          onAdd={() => addArrayItem('education', { institution: '', degree: '', year: '', gpa: '' })}
          onRemove={(i) => removeArrayItem('education', i)} onChange={handleArrayChange}
          disableAdd={isLastItemEmpty('education')}
        />
      </div>
    </div>
  );
};

export default ResumeBuilderPage;
