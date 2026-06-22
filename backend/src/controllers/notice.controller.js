import supabase from '../utils/supabase.js';

// Get all notices (visible to both admin and employee)
export const getNotices = async (req, res) => {
  try {
    const { data: notices, error } = await supabase
      .from('Notice')
      .select('*, admin:Admin(name)')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(notices || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a notice (Admin only)
export const createNotice = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const { data: notice, error } = await supabase
      .from('Notice')
      .insert({
        title,
        content,
        adminId: req.user.id
      })
      .select('*, admin:Admin(name)')
      .single();

    if (error) throw error;
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a notice (Admin only)
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: existing, error: findError } = await supabase.from('Notice').select('id').eq('id', id).maybeSingle();
    if (findError) throw findError;
    if (!existing) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    const { error } = await supabase.from('Notice').delete().eq('id', id);
    if (error) throw error;
    
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
