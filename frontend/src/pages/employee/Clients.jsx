import { useState, useEffect } from 'react';
import api from '../../services/api';
import useRealtimeSync from '../../hooks/useRealtimeSync';

export default function EmployeeClients() {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchMyClients();
  }, []);

  useRealtimeSync('Client', () => {
    fetchMyClients(meta.page);
  });

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
    (c.industryType && c.industryType.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.recruitmentPositionRequired && c.recruitmentPositionRequired.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
            <div 
              key={client.id} 
              className="card-hover p-6 flex flex-col justify-between h-full space-y-6 cursor-pointer"
              onClick={() => { setSelectedClient(client); setIsModalOpen(true); }}
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">domain</span>
                  </div>
                  {client.industryType && (
                    <span className="badge-neutral text-xs">
                      {client.industryType}
                    </span>
                  )}
                </div>

                {/* Company details */}
                <div>
                  <h3 className="text-title-lg font-bold text-on-surface tracking-tight leading-snug">{client.name}</h3>
                  {client.recruitmentPositionRequired && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary-container text-on-secondary-container text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[14px]">work</span>
                      {client.recruitmentPositionRequired}
                    </div>
                  )}
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
                <span className="text-primary font-medium flex items-center gap-1">View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span></span>
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
      {/* Client Details Modal */}
      {isModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setIsModalOpen(false); setSelectedClient(null); }}
              className="absolute top-6 right-6 btn-icon bg-surface-container hover:bg-surface-container-high rounded-full w-10 h-10 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-4 mb-8 border-b border-outline-variant/30 pb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-3xl">domain</span>
              </div>
              <div>
                <h2 className="text-headline-sm font-bold text-on-surface">{selectedClient.name}</h2>
                {selectedClient.industryType && (
                  <span className="badge-neutral text-xs mt-1 inline-block">
                    {selectedClient.industryType}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-8">
              {/* Core Info */}
              {selectedClient.recruitmentPositionRequired && (
                <div className="bg-secondary-container/50 p-5 rounded-2xl border border-secondary/20">
                  <p className="text-label-md text-on-secondary-container/80 uppercase tracking-wider font-bold mb-1">Recruitment Position Required</p>
                  <div className="flex items-center gap-2 text-on-secondary-container">
                    <span className="material-symbols-outlined text-[24px]">work</span>
                    <span className="text-title-md font-bold">{selectedClient.recruitmentPositionRequired}</span>
                  </div>
                </div>
              )}

              {/* Company Info */}
              <div>
                <h3 className="text-title-md font-bold text-on-surface mb-4">Company Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div>
                    <p className="text-label-md text-outline">Company Type</p>
                    <p className="text-body-lg font-medium text-on-surface">{selectedClient.companyType || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-label-md text-outline">Website</p>
                    {selectedClient.website ? (
                      <a href={selectedClient.website.startsWith('http') ? selectedClient.website : `https://${selectedClient.website}`} target="_blank" rel="noopener noreferrer" className="text-body-lg font-medium text-primary hover:underline flex items-center gap-1 w-fit">
                        {selectedClient.website} <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                    ) : <p className="text-body-lg font-medium text-on-surface">Not specified</p>}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-title-md font-bold text-on-surface mb-4">Location</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <p className="text-label-md text-outline">Company Address</p>
                    <p className="text-body-lg font-medium text-on-surface">{selectedClient.companyAddress || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-label-md text-outline">City</p>
                    <p className="text-body-lg font-medium text-on-surface">{selectedClient.city || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-label-md text-outline">State</p>
                    <p className="text-body-lg font-medium text-on-surface">{selectedClient.state || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-title-md font-bold text-on-surface mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4 bg-surface-container-low p-5 rounded-2xl">
                  <div className="sm:col-span-2">
                    <p className="text-label-md text-outline">Contact Name</p>
                    <p className="text-body-lg font-bold text-on-surface">{selectedClient.contactName || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-label-md text-outline">Email</p>
                    {selectedClient.email ? (
                      <a href={`mailto:${selectedClient.email}`} className="text-body-lg font-medium text-primary hover:underline flex items-center gap-1.5 w-fit">
                        <span className="material-symbols-outlined text-[16px]">mail</span> {selectedClient.email}
                      </a>
                    ) : <p className="text-body-lg font-medium text-on-surface">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-label-md text-outline">Phone</p>
                    {selectedClient.phone ? (
                      <a href={`tel:${selectedClient.phone}`} className="text-body-lg font-medium text-primary hover:underline flex items-center gap-1.5 w-fit">
                        <span className="material-symbols-outlined text-[16px]">phone</span> {selectedClient.phone}
                      </a>
                    ) : <p className="text-body-lg font-medium text-on-surface">Not specified</p>}
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button
                  onClick={() => { setIsModalOpen(false); setSelectedClient(null); }}
                  className="btn-primary px-8"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
