import { useState, useEffect } from 'react';
import supabase from '../../services/supabase';
import useAuthStore from '../../store/authStore';
import useRealtimeSync from '../../hooks/useRealtimeSync';

const STATUS_OPTIONS = [
  'Registered', 'Screening', 'Contacted', 'Interested',
  'Interview Scheduled', 'Interview Completed',
  'Selected', 'Offer Released', 'Joined', 'Rejected'
];

const STATUS_COLORS = {
  'Registered':           'badge-neutral',
  'Screening':            'badge-info',
  'Contacted':            'badge-info',
  'Interested':           'badge-primary',
  'Interview Scheduled':  'badge-warning',
  'Interview Completed':  'badge-warning',
  'Selected':             'badge-success',
  'Offer Released':       'badge-success',
  'Joined':               'badge-success',
  'Rejected':             'badge-error',
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user, isEmployee } = useAuthStore();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected candidate & form data
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', skills: '',
    experience: '', education: '', location: '', status: 'Registered',
    jobTitle: '', applicationDate: '', linkedin: '', portfolio: ''
  });

  // Resume and Photo upload
  const [resumeFile, setResumeFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchCandidates(); }, []);

  // Sync data in real-time
  useRealtimeSync('Candidate', () => {
    fetchCandidates(meta.page);
  });

  const fetchCandidates = async (page = 1) => {
    try {
      setLoading(true);
      const from = (page - 1) * 10;
      const to = from + 9;
      
      let query = supabase
        .from('Candidate')
        .select('*, selectedBy:selectedById(name)', { count: 'exact' })
        .order('createdAt', { ascending: false });
        
      if (statusFilter) query = query.eq('status', statusFilter);
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,skills.ilike.%${searchTerm}%`);
      }
      
      const { data, count, error } = await query.range(from, to);
      if (error) throw error;
      
      setCandidates(data || []);
      setMeta({ page, limit: 10, total: count || 0, totalPages: Math.ceil((count || 0) / 10) || 1 });
    } catch (err) {
      setError(err.message || 'Failed to fetch candidates');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => fetchCandidates(1), 300);
    return () => clearTimeout(t);
  }, [searchTerm, statusFilter]);

  const openAdd = () => {
    setSelected(null);
    setFormData({ name: '', email: '', phone: '', skills: '', experience: '', education: '', location: '', status: 'Registered', jobTitle: '', applicationDate: '', linkedin: '', portfolio: '' });
    setResumeFile(null);
    setPhotoFile(null);
    setIsFormOpen(true);
  };

  const openEdit = (c) => {
    setSelected(c);
    setFormData({
      name: c.name || '', email: c.email || '', phone: c.phone || '',
      skills: c.skills || '', experience: c.experience?.toString() || '',
      education: c.education || '', location: c.location || '', status: c.status || 'Registered',
      jobTitle: c.jobTitle || '', applicationDate: c.applicationDate ? new Date(c.applicationDate).toISOString().split('T')[0] : '', linkedin: c.linkedin || '', portfolio: c.portfolio || ''
    });
    setResumeFile(null);
    setPhotoFile(null);
    setIsFormOpen(true);
  };

  const openDetail = (c) => {
    setSelected(c);
    setResumeFile(null);
    setPhotoFile(null);
    setIsDetailOpen(true);
  };

  const openDelete = (c) => {
    setSelected(c);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };

      // Handle optional file uploads via Supabase Storage
      if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('resumes').upload(`public/${fileName}`, resumeFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(`public/${fileName}`);
        payload.resumeUrl = publicUrl;
      }

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('photos').upload(`public/${fileName}`, photoFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(`public/${fileName}`);
        payload.photoUrl = publicUrl;
      }
      
      // Clean up empty strings for numbers if needed
      if (!payload.experience) payload.experience = null;

      if (selected) {
        const { data, error } = await supabase.from('Candidate').update(payload).eq('id', selected.id).select('*, selectedBy:selectedById(name)').single();
        if (error) throw error;
        setCandidates(candidates.map(c => c.id === selected.id ? data : c));
      } else {
        const { data, error } = await supabase.from('Candidate').insert([payload]).select('*, selectedBy:selectedById(name)').single();
        if (error) throw error;
        setCandidates([data, ...candidates]);
      }
      
      setIsFormOpen(false);
      setResumeFile(null);
      setPhotoFile(null);
    } catch (err) {
      setError(err.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('Candidate').delete().eq('id', selected.id);
      if (error) throw error;
      setCandidates(candidates.filter(c => c.id !== selected.id));
      setIsDeleteOpen(false);
    } catch (err) {
      setError(err.message || 'Deletion failed');
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile || !selected) return;
    try {
      setUploading(true);
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('resumes').upload(`public/${fileName}`, resumeFile);
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(`public/${fileName}`);
      
      const { data, error } = await supabase.from('Candidate').update({ resumeUrl: publicUrl }).eq('id', selected.id).select('*, selectedBy:selectedById(name)').single();
      if (error) throw error;
      
      setCandidates(candidates.map(c => c.id === selected.id ? data : c));
      setSelected(data);
      setResumeFile(null);
      alert('Resume uploaded successfully!');
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleSelect = async (e, candidate) => {
    e.stopPropagation();
    try {
      const isSelected = candidate.selectedById === user?.id;
      const { data, error } = await supabase
        .from('Candidate')
        .update({ selectedById: isSelected ? null : user?.id, status: isSelected ? 'Registered' : 'Selected' })
        .eq('id', candidate.id)
        .select('*, selectedBy:selectedById(name)')
        .single();
        
      if (error) throw error;
      
      setCandidates(candidates.map(c => c.id === candidate.id ? data : c));
      if (selected && selected.id === candidate.id) {
        setSelected(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to toggle selection');
    }
  };

  // Metrics
  const total = meta.total || candidates.length;
  const activeCount = candidates.filter(c => !['Rejected', 'Joined'].includes(c.status)).length;
  const joinedCount = candidates.filter(c => c.status === 'Joined').length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Candidate Pool</h1>
          <p className="text-outline mt-1.5">Manage and track all candidates in the recruitment pipeline.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 self-start md:self-auto">
          <span className="material-symbols-outlined">person_add</span>
          Add Candidate
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Total Candidates</p>
            <h3 className="text-headline-md font-bold text-on-surface mt-1">{total}</h3>
          </div>
        </div>
        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Active Pipeline</p>
            <h3 className="text-headline-md font-bold text-blue-700 mt-1">{activeCount}</h3>
          </div>
        </div>
        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Joined</p>
            <h3 className="text-headline-md font-bold text-green-700 mt-1">{joinedCount}</h3>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="text-body-md font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="btn-icon w-8 h-8 hover:bg-black/5">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
          <input
            type="text"
            placeholder="Search by name, email, skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field min-w-[200px]"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Candidate Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-outline text-body-md">Loading candidates...</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline mx-auto">
              <span className="material-symbols-outlined text-3xl">person_off</span>
            </div>
            <h4 className="text-title-lg font-bold text-on-surface">No candidates found</h4>
            <p className="text-body-md text-outline mt-1">Add your first candidate to the pool using the button above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-outline text-label-md font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Skills</th>
                  <th className="px-6 py-4">Experience</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {candidates.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-container-low transition-colors duration-150 cursor-pointer" onClick={() => openDetail(c)}>
                    <td className="px-6 py-5">
                      <div className="font-bold text-on-surface text-body-lg">
                        {c.name} {c.displayId && <span className="text-label-sm text-outline font-normal ml-1">({c.displayId})</span>}
                      </div>
                      <div className="text-label-md text-outline">{c.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                        {c.skills ? c.skills.split(',').slice(0, 3).map((s, i) => (
                          <span key={i} className="badge-primary text-xs">{s.trim()}</span>
                        )) : <span className="text-outline text-label-md">—</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-body-md text-on-surface-variant">
                      {c.experience != null ? `${c.experience} yrs` : '—'}
                    </td>
                    <td className="px-6 py-5 text-body-md text-on-surface-variant">
                      {c.location || '—'}
                    </td>
                    <td className="px-6 py-5">
                      <span className={STATUS_COLORS[c.status] || 'badge-neutral'}>{c.status}</span>
                    </td>
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-3">
                        {isEmployee() && (
                          c.selectedById === user?.id ? (
                            <button onClick={(e) => handleToggleSelect(e, c)} className="badge-primary px-3 py-1.5 hover:opacity-80 transition-opacity">
                              Unselect
                            </button>
                          ) : c.selectedById ? (
                            <span className="text-label-sm text-outline-variant italic">Selected by {c.selectedBy?.name}</span>
                          ) : (
                            <button onClick={(e) => handleToggleSelect(e, c)} className="btn-secondary px-3 py-1 text-sm">
                              Select
                            </button>
                          )
                        )}
                        {!isEmployee() && c.selectedById && (
                          <span className="text-label-sm text-outline italic">Selected by {c.selectedBy?.name}</span>
                        )}
                        <div className="flex items-center gap-1 border-l border-outline-variant/30 pl-3 ml-1">
                          {(!isEmployee() || !c.selectedById || c.selectedById === user?.id) && (
                            <>
                              <button onClick={() => openEdit(c)} title="Edit" className="btn-icon hover:text-secondary">
                                <span className="material-symbols-outlined text-[20px]">edit</span>
                              </button>
                              <button onClick={() => openDelete(c)} title="Delete" className="btn-icon hover:text-error">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                <span className="text-label-md text-outline font-medium">Page {meta.page} of {meta.totalPages}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchCandidates(meta.page - 1)} 
                    disabled={meta.page === 1}
                    className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => fetchCandidates(meta.page + 1)} 
                    disabled={meta.page === meta.totalPages}
                    className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Add / Edit Modal ───────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-thin">
            <button onClick={() => setIsFormOpen(false)} className="absolute top-6 right-6 btn-icon">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h2 className="text-headline-md font-bold text-on-surface mb-6">
              {selected ? 'Edit Candidate' : 'Add New Candidate'}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input required type="text" placeholder="Jane Doe" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Email Address *</label>
                  <input required type="email" placeholder="jane@example.com" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Mobile Number *</label>
                  <input required type="text" placeholder="+1 555 123 4567" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Current Location *</label>
                  <input required type="text" placeholder="City, Country" value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Total Experience (or Fresher) *</label>
                  <input required type="text" placeholder="e.g. 5 Years or Fresher" value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Current/Latest Job Title (Optional)</label>
                  <input type="text" placeholder="Frontend Developer" value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Key Skills *</label>
                  <input required type="text" placeholder="React, Node.js" value={formData.skills}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Date of Application *</label>
                  <input required type="date" value={formData.applicationDate}
                    onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">LinkedIn Profile (Optional)</label>
                  <input type="url" placeholder="https://linkedin.com/in/..." value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Portfolio / GitHub (Optional)</label>
                  <input type="url" placeholder="https://github.com/..." value={formData.portfolio}
                    onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="input-label">Candidate Photo (Optional)</label>
                <input type="file" accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files[0])}
                  className="input-field p-2 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {selected && selected.photoUrl && !photoFile && (
                  <p className="text-label-sm text-outline mt-1">Current photo is already uploaded. Uploading a new one will replace it.</p>
                )}
              </div>
              <div>
                <label className="input-label">Resume Upload (Optional)</label>
                <input type="file" accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="input-field p-2 file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {selected && selected.resumeUrl && !resumeFile && (
                  <p className="text-label-sm text-outline mt-1">Current resume is already uploaded. Uploading a new one will replace it.</p>
                )}
              </div>
              {selected && (
                <div>
                  <label className="input-label">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="btn-ghost px-6">Cancel</button>
                <button type="submit" className="btn-primary">{selected ? 'Save Changes' : 'Add Candidate'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Candidate Detail Drawer ────────────────────────── */}
      {isDetailOpen && selected && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-end z-50">
          <div className="card w-full max-w-md h-full shadow-2xl p-8 overflow-y-auto scrollbar-thin space-y-8 rounded-none rounded-l-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-headline-md font-bold text-on-surface">Candidate Profile</h2>
              <button onClick={() => setIsDetailOpen(false)} className="btn-icon">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Identity */}
            <div className="flex items-center gap-5">
              {selected.photoUrl ? (
                <img src={selected.photoUrl} alt={selected.name} className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {selected.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="text-title-lg font-bold text-on-surface">
                  {selected.name} {selected.displayId && <span className="text-body-md text-outline font-normal ml-1">({selected.displayId})</span>}
                </h3>
                <p className="text-body-md text-outline">{selected.email}</p>
                {selected.phone && <p className="text-label-md text-outline">{selected.phone}</p>}
                {selected.selectedById && (
                  <p className="text-label-md font-semibold text-primary mt-1">
                    Selected by {selected.selectedBy?.name}
                  </p>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-label-md font-bold text-outline uppercase tracking-wider mb-2">Pipeline Status</p>
              <span className={`${STATUS_COLORS[selected.status] || 'badge-neutral'} text-sm`}>{selected.status}</span>
            </div>

            {/* Details Grid */}
            <div className="bg-surface-container-low p-5 rounded-2xl space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-label-md text-outline font-semibold">Job Title</p>
                  <p className="text-body-md text-on-surface font-medium">{selected.jobTitle || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-label-md text-outline font-semibold">Experience</p>
                  <p className="text-body-md text-on-surface font-medium">{selected.experience || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-label-md text-outline font-semibold">Location</p>
                  <p className="text-body-md text-on-surface font-medium">{selected.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-label-md text-outline font-semibold">Date of Application</p>
                  <p className="text-body-md text-on-surface font-medium">{selected.applicationDate ? new Date(selected.applicationDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="col-span-2 mt-2">
                  <p className="text-label-md text-outline font-semibold">Links</p>
                  <div className="flex flex-col gap-1 mt-1">
                    {selected.linkedin ? (
                      <a href={selected.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-body-sm">LinkedIn Profile</a>
                    ) : <span className="text-body-sm text-on-surface-variant">No LinkedIn</span>}
                    {selected.portfolio ? (
                      <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-body-sm">Portfolio / GitHub</a>
                    ) : <span className="text-body-sm text-on-surface-variant">No Portfolio</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-label-md font-bold text-outline uppercase tracking-wider mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {selected.skills ? selected.skills.split(',').map((s, i) => (
                  <span key={i} className="badge-primary text-xs">{s.trim()}</span>
                )) : <span className="text-outline text-body-md">No skills listed</span>}
              </div>
            </div>

            {/* Resume Section */}
            <div className="border-t border-outline-variant/30 pt-6 space-y-4">
              <p className="text-label-md font-bold text-outline uppercase tracking-wider">Resume</p>
              {selected.resumeUrl ? (
                <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2 w-fit">
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  Download Resume
                </a>
              ) : (
                <p className="text-body-md text-outline">No resume uploaded yet.</p>
              )}
              <div className="flex items-center gap-3">
                {(!isEmployee() || !selected.selectedById || selected.selectedById === user?.id) ? (
                  <>
                    <input type="file" accept=".pdf,.doc,.docx"
                      onChange={(e) => setResumeFile(e.target.files[0])}
                      className="text-body-md text-on-surface file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-label-md file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all"
                    />
                    {resumeFile && (
                      <button onClick={handleResumeUpload} disabled={uploading}
                        className="btn-primary text-sm py-2 px-4 disabled:opacity-70">
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-label-sm text-outline italic">Upload disabled (selected by another employee).</p>
                )}
              </div>
            </div>

            {/* Actions */}
            {(!isEmployee() || !selected.selectedById || selected.selectedById === user?.id) && (
              <div className="border-t border-outline-variant/30 pt-6 flex gap-3">
                <button onClick={() => { setIsDetailOpen(false); openEdit(selected); }}
                  className="btn-secondary flex items-center gap-2 flex-1 justify-center">
                  <span className="material-symbols-outlined text-[18px]">edit</span> Edit
                </button>
                <button onClick={() => { setIsDetailOpen(false); openDelete(selected); }}
                  className="bg-error/10 text-error px-6 py-2.5 rounded-full font-semibold hover:bg-error/20 transition-all flex items-center gap-2 flex-1 justify-center">
                  <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─────────────────────────────── */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-bold">delete</span>
            </div>
            <div>
              <h3 className="text-title-lg font-bold text-on-surface">Delete Candidate?</h3>
              <p className="text-body-md text-outline mt-2">
                Are you sure you want to remove <strong className="text-on-surface">{selected?.name}</strong> from the candidate pool? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={() => setIsDeleteOpen(false)} className="btn-ghost px-6">Cancel</button>
              <button onClick={handleDelete}
                className="bg-error text-on-error px-6 py-2.5 rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
