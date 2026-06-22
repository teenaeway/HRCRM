import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active items for modals
  const [selectedClient, setSelectedClient] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');

  // Client form state
  const [formData, setFormData] = useState({
    name: '',
    recruitmentPositionRequired: '',
    contactName: '',
    email: '',
    phone: '',
    employeeId: ''
  });

  // Search/Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    fetchClients();
    fetchEmployees();
  }, []);

  const fetchClients = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.get('/clients', { params: { page, limit: 10 } });
      setClients(res.data.data || res.data);
      if (res.data.meta) setMeta(res.data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/clients/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch employees list', err);
    }
  };

  const handleOpenAdd = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      recruitmentPositionRequired: '',
      contactName: '',
      email: '',
      phone: '',
      employeeId: ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      recruitmentPositionRequired: client.recruitmentPositionRequired || '',
      contactName: client.contactName || '',
      email: client.email || '',
      phone: client.phone || '',
      employeeId: client.employeeId || ''
    });
    setIsFormModalOpen(true);
  };

  const handleOpenAssign = (client) => {
    setSelectedClient(client);
    setAssigneeId(client.employeeId || '');
    setIsAssignModalOpen(true);
  };

  const handleOpenDelete = (client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedClient) {
        // Edit mode
        const res = await api.put(`/clients/${selectedClient.id}`, formData);
        setClients(clients.map(c => c.id === selectedClient.id ? res.data : c));
      } else {
        // Create mode
        const res = await api.post('/clients', formData);
        setClients([res.data, ...clients]);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/clients/${selectedClient.id}/assign`, {
        employeeId: assigneeId || null
      });
      setClients(clients.map(c => c.id === selectedClient.id ? res.data : c));
      setIsAssignModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
      await api.delete(`/clients/${selectedClient.id}`);
      setClients(clients.filter(c => c.id !== selectedClient.id));
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Deletion failed');
    }
  };

  // Metrics calculations
  const totalClients = meta.total || clients.length;
  const assignedClients = clients.filter(c => c.employeeId).length;
  const unassignedClients = totalClients - assignedClients;

  // Filter clients
  const filteredClients = clients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contactName && client.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.recruitmentPositionRequired && client.recruitmentPositionRequired.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesPosition = positionFilter ? client.recruitmentPositionRequired === positionFilter : true;

    return matchesSearch && matchesPosition;
  });

  // Unique positions for filter dropdown
  const positions = [...new Set(clients.map(c => c.recruitmentPositionRequired).filter(Boolean))];

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Client Management</h1>
          <p className="text-outline mt-1.5">Create, modify, and assign clients to recruitment employees.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="btn-primary flex items-center gap-2 self-start md:self-auto"
        >
          <span className="material-symbols-outlined">add</span>
          Add New Client
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Total Clients</p>
            <h3 className="text-headline-md font-bold text-on-surface mt-1">{totalClients}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Assigned</p>
            <h3 className="text-headline-md font-bold text-green-700 mt-1">{assignedClients}</h3>
          </div>
        </div>

        <div className="card p-6 flex flex-col justify-center">
          <div>
            <p className="text-label-md font-semibold text-outline uppercase tracking-wider">Unassigned</p>
            <h3 className="text-headline-md font-bold text-yellow-700 mt-1">{unassignedClients}</h3>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 bg-error-container text-on-error-container rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <span className="text-body-md font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="btn-icon w-8 h-8 hover:bg-black/5">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Filter and Search Section */}
      <div className="card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, contact, position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-12"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="input-field min-w-[180px]"
          >
            <option value="">All Positions</option>
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clients Table Card */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-outline text-body-md">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-outline mx-auto">
              <span className="material-symbols-outlined text-3xl">domain_disabled</span>
            </div>
            <div>
              <h4 className="text-title-lg font-bold text-on-surface">No clients found</h4>
              <p className="text-body-md text-outline mt-1">Try matching another search keyword or create a client.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant text-outline text-label-md font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Client Detail</th>
                  <th className="px-6 py-4">Recruitment Position Required</th>
                  <th className="px-6 py-4">Primary Contact</th>
                  <th className="px-6 py-4">Assigned Recruiter</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-surface-container-low transition-colors duration-150 group">
                    <td className="px-6 py-5">
                      <div className="font-bold text-on-surface text-body-lg">{client.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="badge-neutral">{client.recruitmentPositionRequired || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-body-md text-on-surface-variant font-medium">{client.contactName || 'N/A'}</div>
                      <div className="text-label-md text-outline">{client.email || 'No email'} · {client.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-5">
                      {client.employee ? (
                        <div className="flex items-center gap-2">
                          <span className="badge-primary flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">badge</span>
                            {client.employee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="badge-warning flex items-center gap-1.5 self-start w-fit">
                          <span className="material-symbols-outlined text-[16px]">warning</span>
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenAssign(client)}
                          title="Assign Recruiter"
                          className="btn-icon hover:text-primary"
                        >
                          <span className="material-symbols-outlined text-[20px]">assignment_ind</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(client)}
                          title="Edit Client"
                          className="btn-icon hover:text-secondary"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleOpenDelete(client)}
                          title="Delete Client"
                          className="btn-icon hover:text-error"
                        >
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="p-4 border-t border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
                <span className="text-label-md text-outline font-medium">Page {meta.page} of {meta.totalPages}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => fetchClients(meta.page - 1)} 
                    disabled={meta.page === 1}
                    className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
                  >
                    Previous
                  </button>
                  <button 
                    onClick={() => fetchClients(meta.page + 1)} 
                    disabled={meta.page === meta.totalPages}
                    className="btn-ghost px-4 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/50 hover:bg-surface-container-high transition-colors text-sm rounded-lg"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Client Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsFormModalOpen(false)}
              className="absolute top-6 right-6 btn-icon"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-headline-md font-bold text-on-surface mb-6">
              {selectedClient ? 'Edit Client Details' : 'Add New Client'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="input-label">Client / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Recruitment Position Required</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer, Sales Manager"
                  value={formData.recruitmentPositionRequired}
                  onChange={(e) => setFormData({ ...formData, recruitmentPositionRequired: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="border-t border-outline-variant/30 pt-4">
                <h4 className="text-label-md font-bold text-outline uppercase tracking-wider mb-4">Contact Person</h4>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. John Doe"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="input-label">Phone</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 019-2834"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="btn-ghost px-6"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Employee Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsAssignModalOpen(false)}
              className="absolute top-6 right-6 btn-icon"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-headline-md font-bold text-on-surface mb-2">Assign Recruiter</h2>
            <p className="text-outline text-body-md mb-6">
              Select an employee to manage recruitment operations for <strong className="text-on-surface">{selectedClient?.name}</strong>.
            </p>

            <form onSubmit={handleAssignSubmit} className="space-y-6">
              <div>
                <label className="input-label">Select Recruiter / Employee</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Unassigned (None)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="btn-ghost px-6"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Update Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 text-center space-y-5">
            <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl font-bold">delete</span>
            </div>
            <div>
              <h3 className="text-title-lg font-bold text-on-surface">Delete Client?</h3>
              <p className="text-body-md text-outline mt-2">
                Are you sure you want to delete <strong className="text-on-surface">{selectedClient?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-ghost px-6"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                className="bg-error text-on-error px-6 py-2.5 rounded-full font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
