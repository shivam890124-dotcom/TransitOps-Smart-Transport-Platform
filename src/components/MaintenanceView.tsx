import React, { useState } from 'react';
import { Maintenance, Vehicle } from '../types.js';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  X, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface MaintenanceViewProps {
  maintenance: Maintenance[];
  vehicles: Vehicle[];
  userRole?: string;
  onCreateMaintenance: (data: any) => Promise<void>;
  onUpdateMaintenance: (id: string, data: any) => Promise<void>;
  onDeleteMaintenance: (id: string) => Promise<void>;
}

export default function MaintenanceView({
  maintenance,
  vehicles,
  userRole,
  onCreateMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance
}: MaintenanceViewProps) {
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Maintenance | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const [cost, setCost] = useState('0');
  const [scheduledDate, setScheduledDate] = useState('');

  const openCreateModal = () => {
    const firstVeh = vehicles[0];
    setEditingRecord(null);
    setVehicleId(firstVeh ? firstVeh._id : '');
    setIssue('');
    setStatus('Pending');
    setCost('150');
    setScheduledDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: Maintenance) => {
    setEditingRecord(record);
    setVehicleId(record.vehicleId);
    setIssue(record.issue);
    setStatus(record.status);
    setCost(record.cost.toString());
    setScheduledDate(record.scheduledDate);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const costNum = Number(cost);
    if (isNaN(costNum) || costNum < 0) {
      setFormError('Maintenance cost must be a positive number');
      return;
    }

    if (!vehicleId || !issue || !scheduledDate) {
      setFormError('Please fill out all mandatory fields');
      return;
    }

    const payload = {
      vehicleId,
      issue,
      status,
      cost: costNum,
      scheduledDate
    };

    try {
      if (editingRecord) {
        await onUpdateMaintenance(editingRecord._id, payload);
      } else {
        await onCreateMaintenance(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit maintenance log');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently discard this maintenance ticket? If the vehicle is in shop, it will be released.')) {
      try {
        await onDeleteMaintenance(id);
      } catch (err: any) {
        alert(err.message || 'Deletion failed');
      }
    }
  };

  const filteredRecords = maintenance.filter(m => {
    return statusFilter === '' || m.status === statusFilter;
  });

  const getStatusClass = (mStatus: string) => {
    switch (mStatus) {
      case 'Pending':
        return 'bg-slate-800 text-slate-400 border-slate-750';
      case 'In Progress':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-750';
    }
  };

  const getStatusIcon = (mStatus: string) => {
    switch (mStatus) {
      case 'Pending':
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
      case 'In Progress':
        return <TrendingUp className="w-3.5 h-3.5 text-amber-400" />;
      case 'Completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return null;
    }
  };

  // Metrics summary
  const totalCost = filteredRecords.reduce((acc, r) => acc + r.cost, 0);
  const activeCount = filteredRecords.filter(r => r.status !== 'Completed').length;
  const completedCount = filteredRecords.filter(r => r.status === 'Completed').length;

  const canModify = userRole === 'admin' || userRole === 'dispatcher';

  return (
    <div className="space-y-6" id="maint-view-root">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="maint-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Maintenance & Repair Workshop</h2>
          <p className="text-sm text-slate-400">Log mechanical issues, track diagnostic statuses, and audit expenditures.</p>
        </div>
        {canModify && (
          <button
            id="register-maint-btn"
            onClick={openCreateModal}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Work Order
          </button>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="maint-metrics-row">
        <div className="bg-[#0a0a15]/80 p-4 rounded-xl border border-slate-850/80 flex items-center justify-between shadow-md">
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Repairs Cost</span>
            <span className="text-2xl font-bold font-mono text-cyan-400">${totalCost.toLocaleString()}</span>
          </div>
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 border border-slate-800">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0a0a15]/80 p-4 rounded-xl border border-slate-850/80 flex items-center justify-between shadow-md">
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Shop Orders</span>
            <span className="text-2xl font-bold font-mono text-amber-400">{activeCount}</span>
          </div>
          <div className="w-10 h-10 bg-[#050508] rounded-lg flex items-center justify-center text-amber-400 border border-slate-800">
            <Wrench className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-[#0a0a15]/80 p-4 rounded-xl border border-slate-850/80 flex items-center justify-between shadow-md">
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Fully Serviced</span>
            <span className="text-2xl font-bold font-mono text-emerald-400">{completedCount}</span>
          </div>
          <div className="w-10 h-10 bg-[#050508] rounded-lg flex items-center justify-center text-emerald-400 border border-slate-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0a0a15]/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col sm:flex-row gap-4 justify-between" id="maint-filter-bar">
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span>Active Workshop Board</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#050508] px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto" id="maint-status-filter-box">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="maint-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-slate-300 outline-none pr-2 cursor-pointer w-full"
          >
            <option value="" className="bg-[#0a0a15] text-slate-300">All Orders</option>
            <option value="Pending" className="bg-[#0a0a15] text-slate-300">Pending</option>
            <option value="In Progress" className="bg-[#0a0a15] text-slate-300">In Progress</option>
            <option value="Completed" className="bg-[#0a0a15] text-slate-300">Completed</option>
          </select>
        </div>
      </div>

      {/* Orders List Feed */}
      {filteredRecords.length === 0 ? (
        <div className="py-20 text-center bg-[#0a0a15]/80 border border-slate-800/80 rounded-2xl shadow-sm" id="maint-empty-state">
          <Wrench className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No maintenance records logged.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="maint-orders-grid">
          {filteredRecords.map((record) => (
            <div key={record._id} className="bg-[#0a0a15]/80 rounded-2xl border border-slate-800/80 p-5 shadow-lg hover:border-cyan-500/25 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 flex flex-col justify-between" id={`maint-card-${record._id}`}>
              <div className="space-y-4">
                {/* Header title */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">{record.vehicleName}</h3>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Vehicle status: <span className="font-semibold text-slate-400">{record.vehicleStatus}</span></span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${getStatusClass(record.status)}`}>
                    {getStatusIcon(record.status)}
                    {record.status}
                  </span>
                </div>

                {/* Issue Description details */}
                <div className="p-3 bg-[#050508] border border-slate-800/60 rounded-xl text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-[10px] uppercase text-slate-500 block tracking-wider">Reported Issue / Symptoms</span>
                  <p className="line-clamp-3">{record.issue}</p>
                </div>

                {/* Logistics scheduling times & costs */}
                <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800/60">
                  <div>
                    <span className="block text-slate-500">Scheduled Repair Date</span>
                    <span className="font-semibold text-slate-300">{record.scheduledDate}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Invoice Amount</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">${record.cost.toLocaleString()}</span>
                  </div>
                </div>

                {record.completedDate && (
                  <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 border border-emerald-500/20 rounded-xl flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Diagnostics Completed on {record.completedDate}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              {canModify && (
                <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between" id={`maint-actions-${record._id}`}>
                  {record.status !== 'Completed' ? (
                    <button
                      id={`edit-maint-btn-${record._id}`}
                      onClick={() => openEditModal(record)}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Briefcase className="w-3.5 h-3.5" /> Adjust Details
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Maintenance Audit Log Approved
                    </span>
                  )}

                  {userRole === 'admin' && (
                    <button
                      id={`delete-maint-btn-${record._id}`}
                      onClick={() => handleDelete(record._id)}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all cursor-pointer"
                      title="Delete ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Log Maintenance Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050508]/75 backdrop-blur-md z-50 flex items-center justify-center p-4" id="maint-modal-backdrop">
          <div className="bg-[#0a0a15] w-full max-w-md rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden" id="maint-modal-card">
            {/* Header */}
            <div className="px-6 py-4 bg-[#050508]/40 border-b border-slate-800/80 flex justify-between items-center" id="maint-modal-header">
              <h3 className="font-bold text-white text-lg">
                {editingRecord ? 'Update Diagnostics Record' : 'Register Mechanical Work Order'}
              </h3>
              <button 
                id="close-maint-modal-btn"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error alerts */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="maint-form">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="maint-veh-select">Select Vehicle</label>
                <select
                  id="maint-veh-select"
                  disabled={editingRecord !== null}
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm disabled:bg-[#050508]/50 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="" className="bg-[#0a0a15] text-slate-300">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id} className="bg-[#0a0a15] text-slate-200">
                      {v.name} ({v.plateNumber}) - [{v.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="maint-issue">Describe Issue / Symptoms</label>
                <textarea
                  id="maint-issue"
                  required
                  rows={3}
                  placeholder="Engine check warning light. Loss of oil pressure under load."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="maint-cost">Estimated/Final Cost ($)</label>
                  <input
                    id="maint-cost"
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="maint-date">Work Scheduled Date</label>
                  <input
                    id="maint-date"
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="maint-status">Workshop Diagnostics Status</label>
                <select
                  id="maint-status"
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                >
                  <option value="Pending" className="bg-[#0a0a15] text-slate-300">Pending (Scheduled)</option>
                  <option value="In Progress" className="bg-[#0a0a15] text-slate-300">In Progress (Brings vehicle into Shop)</option>
                  <option value="Completed" className="bg-[#0a0a15] text-slate-300">Completed (Releases vehicle to Available)</option>
                </select>
                <span className="text-[10px] text-slate-500 block mt-1.5">
                  Putting status to 'In Progress' changes vehicle status to 'In Shop' automatically.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2" id="maint-form-actions">
                <button
                  id="cancel-maint-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-maint-btn"
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {editingRecord ? 'Save Changes' : 'Log Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
