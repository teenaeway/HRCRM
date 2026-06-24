import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { Building, Activity, Bell, Users } from 'lucide-react';
import useRealtimeSync from '../../hooks/useRealtimeSync';

export default function EmployeeDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useRealtimeSync('Candidate', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Client', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Activity', () => setRefreshTrigger(prev => prev + 1));
  useRealtimeSync('Notice', () => setRefreshTrigger(prev => prev + 1));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, noticesRes] = await Promise.all([
          api.get('/dashboard/employee'),
          api.get('/notices')
        ]);
        setData(dashRes.data);
        setNotices(noticesRes.data);
      } catch (err) {
        console.error('Failed to load employee dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  if (loading) {
    return <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>;
  }

  const { metrics, recentActivities, selectedCandidates } = data || { metrics: {}, recentActivities: [], selectedCandidates: [] };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface tracking-tight tracking-[-0.02em]">Welcome, {user?.name}</h1>
          <p className="text-outline mt-2 text-lg">Here is an overview of your recruitment pipeline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(200px,auto)] gap-6">
        
        {/* Card 1: My Assigned Clients */}
        <div className="card md:col-span-2 row-span-1 p-8 flex flex-col justify-center relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider mb-2">My Assigned Clients</p>
            <h3 className="text-6xl font-black text-on-surface">{metrics.myClientsCount || 0}</h3>
          </div>
        </div>

        {/* Card 2: Recent Actions */}
        <div className="card md:col-span-2 row-span-1 p-8 flex flex-col justify-center relative overflow-hidden hover:-translate-y-1 transition-transform duration-300">
          <div className="relative z-10">
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider mb-2">Recent Actions</p>
            <h3 className="text-6xl font-black text-on-surface">{recentActivities.length}</h3>
          </div>
        </div>

        {/* Card 3: System Notices (Vertical) */}
        <div className="card md:col-span-1 row-span-2 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 mb-6">
            <Bell className="text-warning" size={24} /> System Notices
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-thin">
            {notices.length === 0 ? (
              <div className="text-center text-outline font-medium py-10">No current notices.</div>
            ) : (
              notices.slice(0, 5).map(notice => (
                <div key={notice.id} className="bg-surface-container-low rounded-2xl p-4 border-l-4 border-l-warning">
                  <h4 className="font-bold text-on-surface">{notice.title}</h4>
                  <p className="text-sm text-on-surface-variant mt-2 line-clamp-3">{notice.content}</p>
                  <span className="text-xs text-outline block mt-3 font-semibold">
                    {new Date(notice.createdAt).toLocaleDateString()} by {notice.admin?.name || 'Admin'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 4: My Recent Activity (Horizontal) */}
        <div className="card md:col-span-3 row-span-1 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 mb-4">
            <Activity className="text-primary" size={24} /> My Recent Activity
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {recentActivities.length === 0 ? (
              <div className="text-center text-outline font-medium py-10">No recent activities found.</div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map(activity => (
                  <div key={activity.id} className="bg-surface-container-low rounded-2xl p-4 hover:-translate-y-0.5 transition-transform flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center overflow-hidden bg-[#eef1fa]">
                      <img src="/candidate-icon.png" alt="Activity Icon" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-body-lg font-semibold text-on-surface">
                        {activity.action}
                        {activity.candidate && <span className="font-bold"> ({activity.candidate.name})</span>}
                      </p>
                      <p className="text-label-sm text-outline mt-1 font-medium">
                        {new Date(activity.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 5: Selected Candidates */}
        <div className="card md:col-span-3 row-span-1 p-6 flex flex-col hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2 mb-4">
            <Users className="text-secondary" size={24} /> My Selected Candidates
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
            {selectedCandidates.length === 0 ? (
              <div className="text-center text-outline font-medium py-10">You haven't selected any candidates yet.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCandidates.map(c => (
                  <div key={c.id} className="bg-surface-container-low rounded-2xl p-4 flex justify-between items-center hover:-translate-y-0.5 transition-transform">
                    <div>
                      <p className="text-body-lg font-semibold text-on-surface">
                        {c.name} {c.displayId && <span className="text-sm text-outline font-normal ml-1">({c.displayId})</span>}
                      </p>
                      <p className="text-sm text-outline font-medium">{c.email}</p>
                    </div>
                    <span className="badge-primary text-xs px-3 py-1 uppercase tracking-wider">{c.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
