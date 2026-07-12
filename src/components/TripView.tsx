import React, { useState } from 'react';
import { Trip, Vehicle, Driver } from '../types.js';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  X, 
  MapPin, 
  ArrowRight, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  User, 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  FileText
} from 'lucide-react';

interface TripViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  userRole?: string;
  onCreateTrip: (data: any) => Promise<void>;
  onUpdateTripStatus: (id: string, status: string, actualArrivalTime?: string) => Promise<void>;
  onDeleteTrip: (id: string) => Promise<void>;
}

export default function TripView({
  trips,
  vehicles,
  drivers,
  userRole,
  onCreateTrip,
  onUpdateTripStatus,
  onDeleteTrip
}: TripViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [routeFrom, setRouteFrom] = useState('');
  const [routeTo, setRouteTo] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [estimatedArrivalTime, setEstimatedArrivalTime] = useState('');
  const [status, setStatus] = useState<'Draft' | 'Dispatched'>('Draft');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const openCreateModal = () => {
    // Select first available vehicle and driver as default if any
    const firstAvailVeh = vehicles.find(v => v.status === 'Available');
    const firstAvailDrv = drivers.find(d => d.status === 'Available' && d.licenseExpiry >= todayStr);

    setVehicleId(firstAvailVeh ? firstAvailVeh._id : '');
    setDriverId(firstAvailDrv ? firstAvailDrv._id : '');
    setRouteFrom('');
    setRouteTo('');
    setDepartureTime(new Date(Date.now() + 1800000).toISOString().slice(0, 16)); // Default 30 min from now
    setEstimatedArrivalTime(new Date(Date.now() + 14400000).toISOString().slice(0, 16)); // Default 4 hours from now
    setStatus('Draft');
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!vehicleId || !driverId || !routeFrom || !routeTo || !departureTime || !estimatedArrivalTime) {
      setFormError('Please fill out all mandatory route, scheduling, and resource allocation fields');
      return;
    }

    // Safety checks on selected resources on client-side before sending to server
    const selectedVeh = vehicles.find(v => v._id === vehicleId);
    const selectedDrv = drivers.find(d => d._id === driverId);

    if (!selectedVeh || !selectedDrv) {
      setFormError('System Error: Selected vehicle or driver is invalid');
      return;
    }

    // CDL Expiry Check
    if (selectedDrv.licenseExpiry < todayStr) {
      setFormError(`Safety Stop: Cannot dispatch driver ${selectedDrv.name}. Commercial License has expired (${selectedDrv.licenseExpiry})`);
      return;
    }

    // Conflict Check (Only if we are dispatching immediately)
    if (status === 'Dispatched') {
      if (selectedVeh.status === 'On Trip') {
        setFormError(`Conflict: Vehicle ${selectedVeh.name} is already assigned to an active trip`);
        return;
      }
      if (selectedVeh.status === 'In Shop') {
        setFormError(`Conflict: Vehicle ${selectedVeh.name} is undergoing maintenance in shop`);
        return;
      }
      if (selectedVeh.status === 'Retired') {
        setFormError(`Conflict: Vehicle ${selectedVeh.name} is retired from active service`);
        return;
      }

      if (selectedDrv.status === 'On Trip') {
        setFormError(`Conflict: Driver ${selectedDrv.name} is already active on another route`);
        return;
      }
      if (selectedDrv.status === 'Suspended') {
        setFormError(`Conflict: Driver ${selectedDrv.name} is currently suspended from driving duty`);
        return;
      }
    }

    const tripData = {
      vehicleId,
      driverId,
      routeFrom,
      routeTo,
      departureTime: new Date(departureTime).toISOString(),
      estimatedArrivalTime: new Date(estimatedArrivalTime).toISOString(),
      status,
      notes
    };

    try {
      await onCreateTrip(tripData);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to dispatch trip');
    }
  };

  const handleUpdateStatus = async (id: string, targetStatus: string) => {
    try {
      await onUpdateTripStatus(id, targetStatus);
    } catch (err: any) {
      alert(err.message || 'Failed to transition trip status');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this trip record? If the route is active, vehicle and driver will be released.')) {
      try {
        await onDeleteTrip(id);
      } catch (err: any) {
        alert(err.message || 'Deletion failed');
      }
    }
  };

  const filteredTrips = trips.filter(t => {
    const matchesSearch = t.tripId.toLowerCase().includes(search.toLowerCase()) || 
                          t.routeFrom.toLowerCase().includes(search.toLowerCase()) ||
                          t.routeTo.toLowerCase().includes(search.toLowerCase()) ||
                          (t.driverName && t.driverName.toLowerCase().includes(search.toLowerCase())) ||
                          (t.vehicleName && t.vehicleName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === '' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (tStatus: string) => {
    switch (tStatus) {
      case 'Draft':
        return 'bg-slate-800 text-slate-400 border-slate-750';
      case 'Dispatched':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-750';
    }
  };

  const canModify = userRole === 'admin' || userRole === 'dispatcher';

  return (
    <div className="space-y-6" id="trips-view-root">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="trips-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Trip Dispatch Control Room</h2>
          <p className="text-sm text-slate-400">Dispatch routes, assign drivers and vehicles, and track active cargo schedules.</p>
        </div>
        {canModify && (
          <button
            id="open-dispatch-modal-btn"
            onClick={openCreateModal}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Dispatch New Route
          </button>
        )}
      </div>

      {/* Filters bar */}
      <div className="bg-[#0a0a15]/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col sm:flex-row gap-4 justify-between" id="trips-filter-bar">
        <div className="relative flex-1" id="trips-search-container">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="trip-search-input"
            type="text"
            placeholder="Search by trip code, routes, driver name, vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#050508] border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none text-sm text-slate-200 placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#050508] px-3 py-2 rounded-xl border border-slate-800 w-full sm:w-auto" id="trip-status-filter-box">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            id="trip-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-xs font-semibold text-slate-300 outline-none pr-2 cursor-pointer w-full"
          >
            <option value="" className="bg-[#0a0a15] text-slate-300">All Dispatches</option>
            <option value="Draft" className="bg-[#0a0a15] text-slate-300">Draft</option>
            <option value="Dispatched" className="bg-[#0a0a15] text-slate-300">Dispatched</option>
            <option value="Completed" className="bg-[#0a0a15] text-slate-300">Completed</option>
            <option value="Cancelled" className="bg-[#0a0a15] text-slate-300">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trips lists card board */}
      {filteredTrips.length === 0 ? (
        <div className="py-20 text-center bg-[#0a0a15]/80 border border-slate-800/80 rounded-2xl shadow-sm" id="trips-empty-state">
          <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No trips or logistics schedules found.</p>
        </div>
      ) : (
        <div className="space-y-4" id="trips-feed">
          {filteredTrips.map((trip) => (
            <div key={trip._id} className="bg-[#0a0a15]/80 rounded-2xl border border-slate-800/80 p-6 shadow-lg hover:border-cyan-500/25 hover:shadow-[0_0_15px_rgba(6,182,212,0.1)] transition-all duration-300 flex flex-col lg:flex-row lg:items-center justify-between gap-6" id={`trip-card-${trip._id}`}>
              
              {/* Trip visual status & route */}
              <div className="flex-1 space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-800">{trip.tripId}</span>
                  <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusBadgeClass(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                {/* Route detail */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-semibold text-white text-sm">{trip.routeFrom}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block shrink-0" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="font-semibold text-white text-sm">{trip.routeTo}</span>
                  </div>
                </div>

                {/* Assigned Resources details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-slate-500" />
                    <span>Vehicle: <span className="font-semibold text-slate-200">{trip.vehicleName}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    <span>Driver: <span className="font-semibold text-slate-200">{trip.driverName}</span></span>
                  </div>
                </div>

                {/* Scheduling times */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500 pt-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Departure: <span className="font-medium text-slate-400">{new Date(trip.departureTime).toLocaleString()}</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Estimated Arrival: <span className="font-medium text-slate-400">{new Date(trip.estimatedArrivalTime).toLocaleString()}</span></span>
                  </div>
                  {trip.actualArrivalTime && (
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Arrived: {new Date(trip.actualArrivalTime).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {trip.notes && (
                  <div className="p-3 bg-slate-900/40 rounded-xl text-xs text-slate-300 border border-slate-800/60">
                    <span className="font-semibold block text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Dispatcher Notes</span>
                    {trip.notes}
                  </div>
                )}
              </div>

              {/* Status control buttons for Admins & Dispatchers */}
              {canModify && (
                <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-850" id={`trip-controls-${trip._id}`}>
                  {trip.status === 'Draft' && (
                    <button
                      id={`dispatch-trip-btn-${trip._id}`}
                      onClick={() => handleUpdateStatus(trip._id, 'Dispatched')}
                      className="flex-1 lg:flex-none text-xs font-bold bg-[#050508] text-cyan-400 hover:text-cyan-300 border border-slate-850 px-4 py-2 rounded-xl transition-all hover:bg-cyan-500/10 cursor-pointer"
                    >
                      Dispatch Route
                    </button>
                  )}
                  {trip.status === 'Dispatched' && (
                    <button
                      id={`complete-trip-btn-${trip._id}`}
                      onClick={() => handleUpdateStatus(trip._id, 'Completed')}
                      className="flex-1 lg:flex-none text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Completed
                    </button>
                  )}
                  {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                    <button
                      id={`cancel-trip-btn-${trip._id}`}
                      onClick={() => handleUpdateStatus(trip._id, 'Cancelled')}
                      className="text-xs font-semibold bg-[#050508] hover:bg-slate-900 border border-slate-850 text-slate-300 px-4 py-2 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                    >
                      Cancel Trip
                    </button>
                  )}
                  {userRole === 'admin' && (
                    <button
                      id={`delete-trip-btn-${trip._id}`}
                      onClick={() => handleDelete(trip._id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create New Trip Dispatch Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050508]/75 backdrop-blur-md z-50 flex items-center justify-center p-4" id="trip-modal-backdrop">
          <div className="bg-[#0a0a15] w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden" id="trip-modal-card">
            {/* Header */}
            <div className="px-6 py-4 bg-[#050508]/40 border-b border-slate-800/80 flex justify-between items-center" id="trip-modal-header">
              <h3 className="font-bold text-white text-lg">Dispatch Control Registry</h3>
              <button 
                id="close-trip-modal-btn"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error alerts */}
            {formError && (
              <div className="mx-6 mt-4 p-4 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-2.5" id="trip-form-error">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="trip-form">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Vehicle Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-veh-select">Vehicle Allocation</label>
                  <select
                    id="trip-veh-select"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508] border border-slate-800 text-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                  >
                    <option value="" className="bg-[#0a0a15] text-slate-300">-- Choose Vehicle --</option>
                    {vehicles.map(v => {
                      const isDisabled = v.status !== 'Available';
                      return (
                        <option 
                          key={v._id} 
                          value={v._id}
                          disabled={isDisabled}
                          className={isDisabled ? 'text-slate-500 bg-[#0a0a15]' : 'text-slate-200 bg-[#0a0a15]'}
                        >
                          {v.name} ({v.plateNumber}) - [{v.status}]
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">Only 'Available' vehicles can be dispatched.</span>
                </div>

                {/* Driver Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-drv-select">Driver Assignment</label>
                  <select
                    id="trip-drv-select"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#050508] border border-slate-800 text-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                  >
                    <option value="" className="bg-[#0a0a15] text-slate-300">-- Assign Driver --</option>
                    {drivers.map(d => {
                      const isExpired = d.licenseExpiry < todayStr;
                      const isDisabled = d.status !== 'Available' || isExpired;
                      return (
                        <option 
                          key={d._id} 
                          value={d._id}
                          disabled={isDisabled}
                          className={isDisabled ? 'text-slate-500 bg-[#0a0a15]' : 'text-slate-200 bg-[#0a0a15]'}
                        >
                          {d.name} - [{isExpired ? 'EXPIRED LIC' : d.status}]
                        </option>
                      );
                    })}
                  </select>
                  <span className="text-[10px] text-slate-500 block mt-1">Expired CDL license operators are locked.</span>
                </div>

                {/* From / To locations */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-route-from">Route Origin (From)</label>
                  <input
                    id="trip-route-from"
                    type="text"
                    required
                    placeholder="Chicago Hub East"
                    value={routeFrom}
                    onChange={(e) => setRouteFrom(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-route-to">Destination (To)</label>
                  <input
                    id="trip-route-to"
                    type="text"
                    required
                    placeholder="New York Yard 4"
                    value={routeTo}
                    onChange={(e) => setRouteTo(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                {/* Times */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-departure">Departure Time</label>
                  <input
                    id="trip-departure"
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-arrival">Est. Arrival Time</label>
                  <input
                    id="trip-arrival"
                    type="datetime-local"
                    required
                    value={estimatedArrivalTime}
                    onChange={(e) => setEstimatedArrivalTime(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                {/* Immediate Dispatch status toggle */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-status">Workflow Dispatch Status</label>
                  <div className="flex flex-col sm:flex-row gap-4 p-3 bg-[#050508] border border-slate-800 rounded-xl" id="trip-status-radio-group">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input
                        type="radio"
                        name="tripStatus"
                        checked={status === 'Draft'}
                        onChange={() => setStatus('Draft')}
                        className="text-cyan-500 focus:ring-cyan-500/30 h-4 w-4"
                      />
                      <span>Keep as <strong className="text-white">Draft</strong> (Hold resources)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300">
                      <input
                        type="radio"
                        name="tripStatus"
                        checked={status === 'Dispatched'}
                        onChange={() => setStatus('Dispatched')}
                        className="text-cyan-500 focus:ring-cyan-500/30 h-4 w-4"
                      />
                      <span>Release as <strong className="text-white">Dispatched</strong> (Locks vehicle & driver)</span>
                    </label>
                  </div>
                </div>

                {/* Dispatch notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="trip-notes">Cargo manifests & Dispatch Notes</label>
                  <textarea
                    id="trip-notes"
                    placeholder="Fragile cargo. Check refrigerator unit temperatures every 2 hours."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2" id="trip-form-actions">
                <button
                  id="cancel-create-trip-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-trip-btn"
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {status === 'Dispatched' ? 'Dispatch Immediate Route' : 'Save Draft Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
