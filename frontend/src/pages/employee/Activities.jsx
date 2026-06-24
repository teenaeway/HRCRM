import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Activity, Send, CheckCircle2 } from 'lucide-react';
import useRealtimeSync from '../../hooks/useRealtimeSync';

export default function EmployeeActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [dailyInputText, setDailyInputText] = useState('');
  const [submittingDaily, setSubmittingDaily] = useState(false);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities');
      setActivities(res.data);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  useRealtimeSync('Activity', () => {
    fetchActivities();
  });

  // Check if daily input already exists for today
  const today = new Date().toISOString().split('T')[0];
  const todayDailyInput = activities.find(a => 
    a.action === 'Daily Input' && 
    new Date(a.createdAt).toISOString().split('T')[0] === today
  );

  const handleDailySubmit = async (e) => {
    e.preventDefault();
    if (!dailyInputText.trim() || todayDailyInput) return;
    
    setSubmittingDaily(true);
    try {
      const res = await api.post('/activities', {
        action: 'Daily Input',
        details: dailyInputText.trim()
      });
      // Add it to the top of activities to show it in real-time
      setActivities(prev => [res.data, ...prev]);
      setDailyInputText('');
    } catch (err) {
      console.error('Failed to submit daily input', err);
      alert('Failed to submit daily input. Please try again.');
    } finally {
      setSubmittingDaily(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Activity Log</h1>
          <p className="text-outline mt-1.5">A complete timeline of your actions.</p>
        </div>
      </div>

      {/* Daily Input Section */}
      <div className="card p-6 border-t-4 border-primary shadow-sm bg-surface">
        <div className="flex items-center gap-3 mb-4 text-primary">
          <CheckCircle2 size={24} />
          <h3 className="text-title-lg font-bold">Daily Input</h3>
        </div>
        
        {loading ? (
           <div className="animate-pulse h-20 bg-surface-container rounded-lg"></div>
        ) : todayDailyInput ? (
          <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
            <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">✅ You have submitted your daily input for today.</p>
            <p className="text-body-md text-on-surface italic border-l-2 border-green-500 pl-3">"{todayDailyInput.details}"</p>
          </div>
        ) : (
          <form onSubmit={handleDailySubmit} className="space-y-4">
            <p className="text-sm text-outline">Summarize your completed work for the day. You can only submit this once per day!</p>
            <textarea
              className="input-field w-full min-h-[100px] resize-y"
              placeholder="E.g., I screened 5 candidates today, scheduled 2 interviews, and closed the requirement for Client XYZ..."
              value={dailyInputText}
              onChange={(e) => setDailyInputText(e.target.value)}
              required
            ></textarea>
            <button 
              type="submit" 
              className="btn-primary flex items-center gap-2"
              disabled={submittingDaily || !dailyInputText.trim()}
            >
              {submittingDaily ? 'Submitting...' : <><Send size={18} /> Submit Input</>}
            </button>
          </form>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></div>
        ) : activities.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-4 block">local_activity</span>
            <p className="text-outline">No activities logged yet.</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="relative border-l border-outline-variant/50 ml-4 space-y-8 py-4">
              {activities.map(activity => (
                <div key={activity.id} className="relative pl-8">
                  <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-surface border border-outline-variant flex items-center justify-center text-primary shadow-sm">
                    <Activity size={14} />
                  </div>
                  <div>
                    <h4 className="text-title-md font-bold text-on-surface">
                      {activity.action}
                      {activity.candidate && <span className="text-primary ml-1">({activity.candidate.name})</span>}
                    </h4>
                    {activity.details && (
                      <p className="text-body-md text-on-surface-variant mt-1">{activity.details}</p>
                    )}
                    <p className="text-label-sm text-outline mt-2 font-medium">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
