import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import supabase from '../../services/supabase';

export default function AdminSettings() {
  const { user, token, setAuth } = useAuthStore();
  
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const payload = {};
      if (name !== user.name) payload.name = name;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setMessage({ text: 'No changes to save.', type: 'info' });
        return;
      }

      if (payload.name) {
        const { error: dbError } = await supabase.from('Admin').update({ name: payload.name }).eq('id', user.id);
        if (dbError) throw dbError;
        
        const { error: authError } = await supabase.auth.updateUser({ data: { name: payload.name } });
        if (authError) throw authError;
      }

      if (payload.password) {
        const { error: authError } = await supabase.auth.updateUser({ password: payload.password });
        if (authError) throw authError;
      }
      
      // Update local store with new name if changed
      if (payload.name) {
        setAuth({ ...user, name: payload.name }, token);
      }
      
      setPassword('');
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ 
        text: error.message || 'Failed to update settings', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Admin Settings</h1>
          <p className="text-outline mt-1.5">Manage your admin profile and security.</p>
        </div>
      </div>

      <div className="card max-w-2xl p-8 space-y-6">
        <h3 className="text-title-lg font-bold border-b border-outline-variant/30 pb-4">Admin Profile</h3>
        
        {message.text && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-success-container text-on-success-container' : 
            message.type === 'error' ? 'bg-error-container text-on-error-container' : 
            'bg-secondary-container text-on-secondary-container'
          }`}>
            <span className="material-symbols-outlined">
              {message.type === 'success' ? 'check_circle' : message.type === 'error' ? 'error' : 'info'}
            </span>
            <span className="text-body-md font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="input-label">Admin Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
            />
          </div>
          <div>
            <label className="input-label">Admin Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={user?.email || ''} 
              disabled 
            />
          </div>
          <div>
            <label className="input-label">Admin Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Leave blank to keep current password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="pt-6">
          <button 
            className="btn-primary px-8" 
            onClick={handleSave} 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
