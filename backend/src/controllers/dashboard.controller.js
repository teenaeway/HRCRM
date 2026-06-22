import supabase from '../utils/supabase.js';

export const getAdminDashboard = async (req, res) => {
  try {
    const [{ count: totalClients }, { count: totalEmployees }, { count: totalCandidates }] = await Promise.all([
      supabase.from('Client').select('*', { count: 'exact', head: true }),
      supabase.from('Employee').select('*', { count: 'exact', head: true }),
      supabase.from('Candidate').select('*', { count: 'exact', head: true })
    ]);
    
    // Recent activities (last 3)
    const { data: recentActivities } = await supabase
      .from('ActivityLog')
      .select('*, employee:Employee(name), candidate:Candidate(name)')
      .order('createdAt', { ascending: false })
      .limit(3);

    const { data: employees } = await supabase
      .from('Employee')
      .select('id, displayId, name, candidates:Candidate(id, displayId, name, status)')
      .order('name', { ascending: true });

    // Format employee selection stats
    const employeeSelectionStats = (employees || []).map(emp => ({
      id: emp.id,
      displayId: emp.displayId,
      name: emp.name,
      selectedCandidates: (emp.candidates || []).sort((a, b) => a.name.localeCompare(b.name))
    }));

    res.json({
      metrics: {
        totalClients: totalClients || 0,
        totalEmployees: totalEmployees || 0,
        totalCandidates: totalCandidates || 0
      },
      recentActivities: recentActivities || [],
      employeeSelectionStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEmployeeDashboard = async (req, res) => {
  try {
    const { id: employeeId } = req.user;

    const { count: myClientsCount } = await supabase
      .from('Client')
      .select('*', { count: 'exact', head: true })
      .eq('employeeId', employeeId);

    const { data: recentActivities } = await supabase
      .from('ActivityLog')
      .select('*, candidate:Candidate(name)')
      .eq('employeeId', employeeId)
      .order('createdAt', { ascending: false })
      .limit(3);

    const { data: selectedCandidates } = await supabase
      .from('Candidate')
      .select('id, displayId, name, email, status')
      .eq('selectedById', employeeId)
      .order('name', { ascending: true });

    res.json({
      metrics: {
        myClientsCount: myClientsCount || 0
      },
      recentActivities: recentActivities || [],
      selectedCandidates: selectedCandidates || []
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
