import supabase from '../utils/supabase.js';
import { generateDisplayId } from '../utils/generateId.js';

const uploadToSupabase = async (fileBuffer, originalName, mimeType) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  const fileName = `files/${uniqueSuffix}${ext}`;
  
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(fileName, fileBuffer, {
      contentType: mimeType,
      upsert: false
    });
    
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
  return publicUrl;
};

// ── Get All Candidates (Search & Filter) ──────────────────────────
export const getCandidates = async (req, res) => {
  try {
    const { search, location, status, minExperience, page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = supabase
      .from('Candidate')
      .select('*, documents:CandidateDocument(*), selectedBy:Employee(id, name, displayId)', { count: 'exact' });

    if (search) {
      query = query.or(`displayId.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,skills.ilike.%${search}%,education.ilike.%${search}%`);
    }

    if (location) {
      query = query.ilike('location', `%${location}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (minExperience) {
      query = query.gte('experience', minExperience.toString());
    }

    const { data: candidates, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, skip + limitNum - 1);

    if (error) throw error;

    res.json({
      data: candidates,
      meta: {
        total: count,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Candidate By ID ───────────────────────────────────────────
export const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: candidate, error } = await supabase
      .from('Candidate')
      .select('*, documents:CandidateDocument(*), activityLogs:ActivityLog(*)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Create Candidate ──────────────────────────────────────────────
export const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, skills, experience, education, location, jobTitle, applicationDate, linkedin, portfolio } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required' });
    }

    const { data: exists } = await supabase.from('Candidate').select('id').eq('email', email).maybeSingle();
    if (exists) {
      return res.status(400).json({ message: 'A candidate with this email already exists' });
    }

    let fileUrl = null;
    let photoUrl = null;
    
    if (req.files) {
      if (req.files.resume && req.files.resume.length > 0) {
        const file = req.files.resume[0];
        fileUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
      }
      if (req.files.photo && req.files.photo.length > 0) {
        const file = req.files.photo[0];
        photoUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
      }
    }

    const displayId = await generateDisplayId('Candidate', 'CA');

    const { data: candidate, error } = await supabase
      .from('Candidate')
      .insert({
        displayId,
        name,
        email,
        phone,
        skills,
        experience,
        jobTitle,
        applicationDate: applicationDate ? new Date(applicationDate).toISOString() : null,
        linkedin,
        portfolio,
        education,
        location,
        resumeUrl: fileUrl,
        photoUrl,
      })
      .select()
      .single();

    if (error) throw error;

    if (fileUrl && req.files.resume) {
      const { error: docError } = await supabase.from('CandidateDocument').insert({
        candidateId: candidate.id,
        name: req.files.resume[0].originalname,
        fileUrl,
        documentType: 'Resume',
      });
      if (docError) throw docError;
    }

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Candidate ──────────────────────────────────────────────
export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, skills, experience, education, location, status, jobTitle, applicationDate, linkedin, portfolio } = req.body;

    const { data: existing, error: findError } = await supabase.from('Candidate').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (req.user.role === 'employee' && existing.selectedById && existing.selectedById !== req.user.id) {
      return res.status(403).json({ message: 'You cannot edit a candidate selected by another employee.' });
    }

    let fileUrl = existing.resumeUrl;
    let photoUrl = existing.photoUrl;
    
    if (req.files) {
      if (req.files.resume && req.files.resume.length > 0) {
        const file = req.files.resume[0];
        fileUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
        
        await supabase.from('CandidateDocument').insert({
          candidateId: id,
          name: file.originalname,
          fileUrl,
          documentType: 'Resume',
        });
      }
      if (req.files.photo && req.files.photo.length > 0) {
        const file = req.files.photo[0];
        photoUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);
      }
    }

    const { data: candidate, error: updateError } = await supabase
      .from('Candidate')
      .update({
        name,
        email,
        phone,
        skills,
        experience,
        jobTitle,
        applicationDate: applicationDate ? new Date(applicationDate).toISOString() : null,
        linkedin,
        portfolio,
        education,
        location,
        resumeUrl: fileUrl,
        photoUrl,
        status: status || existing.status,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (req.user && req.user.role === 'employee' && status && status !== existing.status) {
      await supabase.from('ActivityLog').insert({
        action: "Status Updated",
        details: `Changed status from ${existing.status} to ${status}`,
        employeeId: req.user.id,
        candidateId: id
      });
    }

    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Delete Candidate ──────────────────────────────────────────────
export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: findError } = await supabase.from('Candidate').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (req.user.role === 'employee' && existing.selectedById && existing.selectedById !== req.user.id) {
      return res.status(403).json({ message: 'You cannot delete a candidate selected by another employee.' });
    }

    const { error: deleteError } = await supabase.from('Candidate').delete().eq('id', id);
    if (deleteError) throw deleteError;

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Upload Resume for Candidate ───────────────────────────────────
export const uploadCandidateResume = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { data: existing, error: findError } = await supabase.from('Candidate').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (req.user.role === 'employee' && existing.selectedById && existing.selectedById !== req.user.id) {
      return res.status(403).json({ message: 'You cannot upload a resume for a candidate selected by another employee.' });
    }

    const fileUrl = await uploadToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype);

    await supabase.from('Candidate').update({ resumeUrl: fileUrl }).eq('id', id);

    await supabase.from('CandidateDocument').insert({
      candidateId: id,
      name: req.file.originalname,
      fileUrl,
      documentType: 'Resume',
    });

    if (req.user && req.user.role === 'employee') {
      await supabase.from('ActivityLog').insert({
        action: "Resume Uploaded",
        details: `Uploaded a new resume for candidate`,
        employeeId: req.user.id,
        candidateId: id
      });
    }

    res.json({ message: 'Resume uploaded successfully', resumeUrl: fileUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Toggle Candidate Selection ────────────────────────────────────
export const toggleCandidateSelection = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user.id;

    if (req.user.role !== 'employee') {
      return res.status(403).json({ message: 'Only employees can select candidates' });
    }

    const { data: candidate, error: findError } = await supabase.from('Candidate').select('*').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (candidate.selectedById && candidate.selectedById !== employeeId) {
      return res.status(400).json({ message: 'Candidate is already selected by another employee' });
    }

    const isSelecting = candidate.selectedById === null;
    
    const { data: updated, error: updateError } = await supabase
      .from('Candidate')
      .update({ selectedById: isSelecting ? employeeId : null })
      .eq('id', id)
      .select('*, selectedBy:Employee(id, name, displayId)')
      .single();

    if (updateError) throw updateError;

    await supabase.from('ActivityLog').insert({
      action: isSelecting ? "Candidate Selected" : "Candidate Unselected",
      details: isSelecting ? `Selected candidate ${candidate.name}` : `Unselected candidate ${candidate.name}`,
      employeeId,
      candidateId: candidate.id
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
