import { useState, useEffect } from 'react';
import supabase from '../../services/supabase';
import { Users, Briefcase, FileText, Activity } from 'lucide-react';
import useRealtimeSync from '../../hooks/useRealtimeSync';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useRealtimeSync('Candidate', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Client', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Employee', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Activity', () => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      const [
        { count: totalClients },
        { count: totalEmployees },
        { count: totalCandidates },
        { data: activities }
      ] = await Promise.all([
        supabase.from('Client').select('*', { count: 'exact', head: true }),
        supabase.from('Employee').select('*', { count: 'exact', head: true }),
        supabase.from('Candidate').select('*', { count: 'exact', head: true }),
        supabase.from('ActivityLog')
          .select('*, employee:employeeId(name), candidate:candidateId(name)')
          .order('createdAt', { ascending: false })
          .limit(10)
      ]);

      setData({
        metrics: { totalClients, totalEmployees, totalCandidates },
        recentActivities: activities || []
      });
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-outline text-body-md">Loading dashboard...</p>
      </div>
    );
  }

  const { metrics, recentActivities } = data || { metrics: {}, recentActivities: [] };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Admin Dashboard</h1>
          <p className="text-outline mt-1.5">Overview of agency operations and recent activities.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Total Clients</p>
            <h3 className="text-4xl font-bold text-on-surface mt-1">{metrics.totalClients || 0}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Total Employees</p>
            <h3 className="text-4xl font-bold text-on-surface mt-1">{metrics.totalEmployees || 0}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Total Candidates</p>
            <h3 className="text-4xl font-bold text-on-surface mt-1">{metrics.totalCandidates || 0}</h3>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="card p-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/30 bg-surface-container-lowest">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Activity className="text-primary" size={24} /> Recent Activities
          </h2>
        </div>
        
        {recentActivities.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-outline">No recent activities found.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/30">
            {recentActivities.map(activity => (
              <div key={activity.id} className="p-6 hover:bg-surface-container-low transition-colors">
                <div className="flex items-start gap-4">
                  <div>
                    <p className="text-body-lg font-semibold text-on-surface">
                      <span className="text-primary">{activity.employee?.name || 'Unknown Employee'}</span>
                      {' '} {activity.action} {' '}
                      {activity.candidate && <span className="font-bold">({activity.candidate.name})</span>}
                    </p>
                    {activity.details && (
                      <p className="text-body-md text-on-surface-variant mt-1">{activity.details}</p>
                    )}
                    <p className="text-label-sm text-outline mt-2">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
