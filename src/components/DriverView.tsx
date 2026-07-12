import React, { useState } from 'react';
import { Driver } from '../types.js';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  XOctagon, 
  Phone, 
  Mail, 
  CreditCard 
} from 'lucide-react';

interface DriverViewProps {
  drivers: Driver[];
  userRole?: string;
  onCreateDriver: (data: any) => Promise<void>;
  onUpdateDriver: (id: string, data: any) => Promise<void>;
  onDeleteDriver: (id: string) => Promise<void>;
}

export default function DriverView({
  drivers,
  userRole,
  onCreateDriver,
  onUpdateDriver,
  onDeleteDriver
}: DriverViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [status, setStatus] = useState<'Available' | 'On Trip' | 'Off Duty' | 'Suspended'>('Available');

  const todayStr = new Date().toISOString().split('T')[0];

  const openCreateModal = () => {
    setEditingDriver(null);
    setName('');
    setEmail('');
    setPhone('');
    setLicenseNumber('');
    setLicenseExpiry(new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0]); // Default 1 year from now
    setStatus('Available');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setName(driver.name);
    setEmail(driver.email);
    setPhone(driver.phone);
    setLicenseNumber(driver.licenseNumber);
    setLicenseExpiry(driver.licenseExpiry);
    setStatus(driver.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const driverData = {
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      status
    };

    try {
      if (editingDriver) {
        await onUpdateDriver(editingDriver._id, driverData);
      } else {
        await onCreateDriver(driverData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit driver data');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this driver file? This action is irreversible.')) {
      try {
        await onDeleteDriver(id);
      } catch (err: any) {
        alert(err.message || 'Deletion failed');
      }
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.email.toLowerCase().includes(search.toLowerCase()) ||
                          d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (dStatus: string) => {
    switch (dStatus) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'On Trip':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Off Duty':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'Suspended':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const isLicenseExpired = (expiryDate: string) => {
    return expiryDate < todayStr;
  };

  const canModify = userRole === 'admin' || userRole === 'dispatcher';

  return (
    <div className="space-y-6" id="drivers-view-root">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="drivers-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Driver Directory & Credentials</h2>
          <p className="text-sm text-slate-400">Monitor driver schedules, commercial license expirations, and work statuses.</p>
        </div>
        {canModify && (
          <button
            id="register-driver-btn"
            onClick={openCreateModal}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Driver
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-[#0a0a15]/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col sm:flex-row gap-4 justify-between" id="drivers-filter-bar">
        <div className="relative flex-1" id="drivers-search-container">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="driver-search-input"
            type="text"
            placeholder="Search by driver name, email or CDL license..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#050508] border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none text-sm text-slate-200 placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#050508] px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto" id="driver-status-filter-box">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="driver-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-slate-300 outline-none pr-2 cursor-pointer w-full"
          >
            <option value="" className="bg-[#0a0a15] text-slate-300">All Statuses</option>
            <option value="Available" className="bg-[#0a0a15] text-slate-300">Available</option>
            <option value="On Trip" className="bg-[#0a0a15] text-slate-300">On Trip</option>
            <option value="Off Duty" className="bg-[#0a0a15] text-slate-300">Off Duty</option>
            <option value="Suspended" className="bg-[#0a0a15] text-slate-300">Suspended</option>
          </select>
        </div>
      </div>

      {/* Grid rendering drivers */}
      {filteredDrivers.length === 0 ? (
        <div className="py-20 text-center bg-[#0a0a15]/80 border border-slate-800/80 rounded-2xl shadow-sm" id="drivers-empty-state">
          <User className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No driver accounts match your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="drivers-grid">
          {filteredDrivers.map((driver) => {
            const expired = isLicenseExpired(driver.licenseExpiry);
            return (
              <div key={driver._id} className={`bg-[#0a0a15]/80 rounded-2xl border p-5 shadow-lg hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between ${
                expired ? 'border-rose-500/30 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.05)]' : 'border-slate-800/80'
              }`} id={`driver-card-${driver._id}`}>
                
                {/* Header Information */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-slate-850 text-cyan-400 border border-slate-850 rounded-xl flex items-center justify-center font-bold font-display text-sm">
                        {driver.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base leading-tight">{driver.name}</h3>
                        <span className={`inline-block px-2 py-0.5 mt-1.5 text-[10px] font-bold rounded-full border ${getStatusBadgeClass(driver.status)}`}>
                          {driver.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expired license danger banner */}
                  {expired && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-300 text-xs font-semibold" id={`driver-license-alert-${driver._id}`}>
                      <XOctagon className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>CDL EXPIRED on {driver.licenseExpiry}!</span>
                    </div>
                  )}

                  {/* Details block */}
                  <div className="space-y-2 text-xs text-slate-400 pt-1">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-slate-300">{driver.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-slate-400">CDL No: <span className="font-mono font-semibold text-slate-200">{driver.licenseNumber}</span></span>
                        {!expired && (
                          <span className="text-[10px] text-slate-500">Expires: {driver.licenseExpiry}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom utilities */}
                {canModify && (
                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-end gap-1.5" id={`driver-actions-${driver._id}`}>
                    <button
                      id={`edit-driver-btn-${driver._id}`}
                      onClick={() => openEditModal(driver)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all cursor-pointer"
                      title="Edit driver profile"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {userRole === 'admin' && (
                      <button
                        id={`delete-driver-btn-${driver._id}`}
                        onClick={() => handleDelete(driver._id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Delete driver file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050508]/75 backdrop-blur-md z-50 flex items-center justify-center p-4" id="driver-modal-backdrop">
          <div className="bg-[#0a0a15] w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden" id="driver-modal-card">
            {/* Header */}
            <div className="px-6 py-4 bg-[#050508]/40 border-b border-slate-800/80 flex justify-between items-center" id="driver-modal-header">
              <h3 className="font-bold text-white text-lg">
                {editingDriver ? `Edit Profile: ${editingDriver.name}` : 'Register Commercial Operator'}
              </h3>
              <button 
                id="close-driver-modal-btn"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error indicators */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="driver-form">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-name">Full Name</label>
                <input
                  id="drv-name"
                  type="text"
                  required
                  placeholder="Elena Rostova"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-email">Work Email</label>
                <input
                  id="drv-email"
                  type="email"
                  required
                  placeholder="elena.r@transitops.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-phone">Phone Number</label>
                <input
                  id="drv-phone"
                  type="text"
                  required
                  placeholder="+1 (555) 485-2901"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-cdl">CDL Number</label>
                  <input
                    id="drv-cdl"
                    type="text"
                    required
                    placeholder="FL-DL-44889"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-cdl-expiry">CDL CDL Expiry</label>
                  <input
                    id="drv-cdl-expiry"
                    type="date"
                    required
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="drv-status">Availability Status</label>
                <select
                  id="drv-status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                >
                  <option value="Available" className="bg-[#0a0a15] text-slate-300">Available</option>
                  <option value="On Trip" className="bg-[#0a0a15] text-slate-300">On Trip</option>
                  <option value="Off Duty" className="bg-[#0a0a15] text-slate-300">Off Duty</option>
                  <option value="Suspended" className="bg-[#0a0a15] text-slate-300">Suspended</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2" id="driver-form-actions">
                <button
                  id="cancel-driver-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-driver-btn"
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {editingDriver ? 'Save Profile' : 'Register Operator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
