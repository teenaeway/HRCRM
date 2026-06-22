import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function EmployeeClients() {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyClients();
  }, []);

  const fetchMyClients = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/clients', { params: { page, limit: 10 } });
      setClients(res.data.data || res.data);
      if (res.data.meta) setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your clients');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.industry && c.industry.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.contactName && c.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">My Assigned Clients</h1>
        <p className="text-outline mt-1.5">View and manage accounts assigned to you for candidate recruitment.</p>
      </div>

      {/* Error notice */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span className="text-body-md font-medium">{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="card p-6 max-w-md">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search my clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="py-20 text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-outline text-body-md">Loading your accounts...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="card p-12 text-center max-w-sm mx-auto space-y-4">
          <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline mx-auto">
            <span className="material-symbols-outlined text-3xl">domain_disabled</span>
          </div>
          <div>
            <h4 className="text-title-lg font-bold text-on-surface">No clients assigned</h4>
            <p className="text-body-md text-outline mt-1">
              You are currently not assigned to any clients. Contact your administrator to assign you client accounts.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client.id} className="card-hover p-6 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">domain</span>
                  </div>
                  {client.industry && (
                    <span className="badge-neutral text-xs">
                      {client.industry}
                    </span>
                  )}
                </div>

                {/* Company details */}
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface tracking-tight leading-snug">{client.name}</h3>
                  <p className="text-label-md text-outline mt-1">Client ID: {client.id.substring(0, 8)}...</p>
                </div>

                {/* Contact information */}
                <div className="bg-surface-container-low p-4 rounded-2xl space-y-3">
                  <p className="text-label-md font-bold text-outline uppercase tracking-wider">Primary Contact</p>
                  <div>
                    <div className="font-semibold text-on-surface text-body-md">{client.contactName || 'No contact specified'}</div>
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="text-body-md text-primary hover:underline flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[16px]">mail</span>
                        {client.email}
                      </a>
                    )}
                    {client.phone && (
                      <div className="text-body-md text-on-surface-variant flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[16px]">phone</span>
                        {client.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer action */}
              <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between text-label-md text-outline">
                <span>Added {new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && meta.totalPages > 1 && (
        <div className="p-4 flex justify-between items-center rounded-2xl bg-surface-container-low mt-6">
          <span className="text-label-md text-outline font-medium">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <button 
              onClick={() => fetchMyClients(meta.page - 1)} 
              disabled={meta.page === 1}
              className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
            >
              Previous
            </button>
            <button 
              onClick={() => fetchMyClients(meta.page + 1)} 
              disabled={meta.page === meta.totalPages}
              className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
