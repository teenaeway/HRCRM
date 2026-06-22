import { useState, useEffect } from 'react';
import api from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Download, Users, Calendar, Activity, Filter } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminReports() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  
  // Default to past 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch employee list on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get('/employees');
        setEmployees(res.data);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Fetch report when employee or dates change
  useEffect(() => {
    if (!selectedEmployee) {
      setReportData(null);
      return;
    }
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/employee/${selectedEmployee}?startDate=${startDate}&endDate=${endDate}`);
        setReportData(res.data);
      } catch (err) {
        console.error("Failed to fetch report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [selectedEmployee, startDate, endDate]);

  const handleExportCSV = () => {
    if (!reportData) return;
    
    // Create CSV content from activities
    const headers = ['Date', 'Action', 'Candidate', 'Details'];
    const rows = reportData.activities.map(act => [
      new Date(act.createdAt).toLocaleString(),
      `"${act.action.replace(/"/g, '""')}"`,
      act.candidate ? `"${act.candidate.name.replace(/"/g, '""')}"` : 'N/A',
      act.details ? `"${act.details.replace(/"/g, '""')}"` : ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `report_${reportData.employee.name.replace(/ /g, '_')}_${startDate}_to_${endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initialLoading) {
    return <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Employee Reports</h1>
          <p className="text-outline mt-1.5">Track day-wise activity and candidate conversion for your team.</p>
        </div>
        <button 
          onClick={handleExportCSV} 
          disabled={!reportData || reportData.activities.length === 0}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={18} /> Export Activity CSV
        </button>
      </div>

      {/* Selector & Filters */}
      <div className="card p-6 border-l-4 border-primary bg-surface flex flex-col xl:flex-row gap-6 items-end shadow-sm">
        <div className="flex-1 w-full">
          <label className="block text-label-md font-bold text-outline mb-2 flex items-center gap-2">
            <Users size={16} /> View Report By Employee:
          </label>
          <select 
            className="input-field w-full cursor-pointer bg-surface-container-low font-medium"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">-- Select an Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name} ({emp.displayId})</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-4 w-full xl:w-auto">
          <div className="flex-1">
            <label className="block text-label-md font-bold text-outline mb-2 flex items-center gap-1"><Calendar size={14} /> Start Date</label>
            <input 
              type="date" 
              className="input-field w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-label-md font-bold text-outline mb-2 flex items-center gap-1"><Calendar size={14} /> End Date</label>
            <input 
              type="date" 
              className="input-field w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Report Data Area */}
      {!selectedEmployee ? (
        <div className="card p-16 text-center text-outline border-dashed bg-surface-container-low/50">
          <Filter size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-title-lg font-bold text-on-surface mb-2">No Employee Selected</h3>
          <p className="max-w-md mx-auto">Please select an employee from the dropdown above to view their day-wise report and activity graphs.</p>
        </div>
      ) : loading ? (
        <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : reportData ? (
        <div className="space-y-8 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Employee Selected Candidates List */}
          <div className="card p-6 shadow-md border border-outline-variant/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-primary">
                <Users size={24} />
                <h3 className="text-title-lg font-bold">Candidates Handled by {reportData.employee.name}</h3>
              </div>
              <span className="badge-secondary">{reportData.candidates.length} Candidates</span>
            </div>
            
            {reportData.candidates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-2 scrollbar-thin">
                {reportData.candidates.map(c => (
                  <div key={c.id} className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/40 flex justify-between items-center shadow-sm hover:border-primary/50 transition-colors">
                    <div>
                      <p className="font-bold text-on-surface truncate max-w-[150px]">{c.name}</p>
                      <p className="text-label-sm text-outline">{c.displayId}</p>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-outline text-center py-6 bg-surface-container-lowest rounded-lg border border-dashed border-outline-variant/50">No candidates assigned to or selected by this employee.</p>
            )}
          </div>

          {/* Graphs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Line Chart */}
            <div className="card p-6 lg:col-span-2 border-t-4 border-primary shadow-md">
              <h3 className="text-title-lg font-bold mb-6">Activity Timeline (Daily)</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.lineChartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" opacity={0.3} vertical={false} />
                    <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888'}} stroke="#eee" />
                    <YAxis tick={{fontSize: 12, fill: '#888'}} stroke="#eee" allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#fff' }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line type="monotone" dataKey="candidatesSelected" name="Candidates Assigned/Handled" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="clientsAssigned" name="Clients Assigned" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="card p-6 border-t-4 border-secondary shadow-md">
              <h3 className="text-title-lg font-bold mb-2">Candidate Status Distribution</h3>
              <p className="text-label-sm text-outline mb-4">Current statuses of their candidates</p>
              <div className="h-64 w-full">
                {reportData.pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {reportData.pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-outline text-sm">No data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Day-wise Activity Table */}
          <div className="card p-0 overflow-hidden border border-outline-variant/30 shadow-md">
            <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest">
              <div className="flex items-center gap-3 text-on-surface">
                <Activity size={24} className="text-primary" />
                <h3 className="text-title-lg font-bold">Day-wise Activity Log</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin bg-surface">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-surface-container-low shadow-sm z-10">
                  <tr className="text-outline text-label-md font-bold uppercase tracking-wider">
                    <th className="py-4 px-6 w-48">Date & Time</th>
                    <th className="py-4 px-6 w-1/4">Action</th>
                    <th className="py-4 px-6">Candidate</th>
                    <th className="py-4 px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {reportData.activities.length > 0 ? (
                    reportData.activities.map(act => (
                      <tr key={act.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-4 px-6 text-sm font-medium text-outline whitespace-nowrap">
                          {new Date(act.createdAt).toLocaleString(undefined, { 
                            year: 'numeric', month: 'short', day: 'numeric', 
                            hour: '2-digit', minute:'2-digit' 
                          })}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-on-surface">
                          <span className="bg-secondary/10 text-secondary px-2 py-1 rounded text-xs tracking-wide">
                            {act.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium">
                          {act.candidate ? act.candidate.name : '-'}
                        </td>
                        <td className="py-4 px-6 text-sm text-outline">
                          {act.details || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-outline">
                        <Activity size={32} className="mx-auto mb-3 opacity-20" />
                        No activities logged for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      ) : null}
    </div>
  );
}
