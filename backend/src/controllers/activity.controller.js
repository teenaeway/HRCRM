import supabase from '../utils/supabase.js';

// Get all activities (Admin sees all, Employee sees only theirs)
export const getActivities = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    let query = supabase
      .from('ActivityLog')
      .select('*, employee:Employee(name), candidate:Candidate(name)');

    if (role === 'employee') {
      query = query.eq('employeeId', userId);
    }

    const { data: activities, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;

    res.json(activities || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Log an activity (Employee/Admin can log)
export const createActivity = async (req, res) => {
  try {
    const { action, details, candidateId } = req.body;
    
    // Admin doesn't necessarily log employee actions directly like this, but we allow it if needed.
    // Usually it's employee logging their own actions.
    const employeeId = req.user.role === 'employee' ? req.user.id : req.body.employeeId;

    if (!action || !employeeId) {
      return res.status(400).json({ message: 'Action and employeeId are required' });
    }

    const { data: activity, error } = await supabase
      .from('ActivityLog')
      .insert({
        action,
        details,
        employeeId,
        candidateId: candidateId || null
      })
      .select('*, employee:Employee(name), candidate:Candidate(name)')
      .single();

    if (error) throw error;

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
