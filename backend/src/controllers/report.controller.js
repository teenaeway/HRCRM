import supabase from '../utils/supabase.js';

export const getEmployeeReport = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    // Ensure end covers the whole day
    end.setHours(23, 59, 59, 999);

    // Fetch activities for the employee
    const { data: activities, error: activitiesError } = await supabase
      .from('ActivityLog')
      .select('*, candidate:Candidate(name, displayId)')
      .eq('employeeId', employeeId)
      .gte('createdAt', start.toISOString())
      .lte('createdAt', end.toISOString())
      .order('createdAt', { ascending: false });

    if (activitiesError) throw activitiesError;

    // Fetch Candidates assigned to or selected by employee
    const { data: candidates, error: candidatesError } = await supabase
      .from('Candidate')
      .select('*')
      .eq('selectedById', employeeId);

    if (candidatesError) throw candidatesError;

    // Status breakdown for Pie Chart
    const statusCounts = {};
    (candidates || []).forEach(c => {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    });
    const pieChartData = Object.keys(statusCounts).map(key => ({
      name: key,
      value: statusCounts[key]
    }));

    // Group candidates selected and clients assigned by date (Cumulative)
    const { data: clients, error: clientsError } = await supabase
      .from('Client')
      .select('*')
      .eq('employeeId', employeeId);

    if (clientsError) throw clientsError;

    // Grouping by Date (YYYY-MM-DD)
    const lineChartMap = {};
    
    // Fill all dates in range with cumulative counts to have a continuous line
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);

        // Count how many were assigned on or before this day
        const candidatesCount = (candidates || []).filter(c => new Date(c.updatedAt) <= endOfDay).length;
        const clientsCount = (clients || []).filter(c => new Date(c.updatedAt) <= endOfDay).length;

        lineChartMap[dateStr] = { 
            date: dateStr, 
            candidatesSelected: candidatesCount, 
            clientsAssigned: clientsCount 
        };
    }

    const lineChartData = Object.values(lineChartMap).sort((a, b) => a.date.localeCompare(b.date));

    // Also get employee info
    const { data: employee, error: employeeError } = await supabase
      .from('Employee')
      .select('id, name, displayId')
      .eq('id', employeeId)
      .maybeSingle();

    if (employeeError) throw employeeError;

    res.json({
      employee,
      activities: activities || [],
      pieChartData,
      lineChartData,
      candidates: candidates || []
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error generating report' });
  }
};
