import React, { useState } from 'react';
import { Vehicle } from '../types.js';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  X, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  MinusCircle,
  TrendingUp
} from 'lucide-react';

interface VehicleViewProps {
  vehicles: Vehicle[];
  userRole?: string;
  onCreateVehicle: (data: any) => Promise<void>;
  onUpdateVehicle: (id: string, data: any) => Promise<void>;
  onDeleteVehicle: (id: string) => Promise<void>;
}

export default function VehicleView({
  vehicles,
  userRole,
  onCreateVehicle,
  onUpdateVehicle,
  onDeleteVehicle
}: VehicleViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<'Truck' | 'Van' | 'Bus' | 'Car'>('Truck');
  const [status, setStatus] = useState<'Available' | 'On Trip' | 'In Shop' | 'Retired'>('Available');
  const [fuelCapacity, setFuelCapacity] = useState('150');
  const [currentFuel, setCurrentFuel] = useState('120');
  const [mileage, setMileage] = useState('10000');

  const openCreateModal = () => {
    setEditingVehicle(null);
    setName('');
    setPlateNumber('');
    setType('Truck');
    setStatus('Available');
    setFuelCapacity('150');
    setCurrentFuel('120');
    setMileage('10000');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setName(vehicle.name);
    setPlateNumber(vehicle.plateNumber);
    setType(vehicle.type);
    setStatus(vehicle.status);
    setFuelCapacity(vehicle.fuelCapacity.toString());
    setCurrentFuel(vehicle.currentFuel.toString());
    setMileage(vehicle.mileage.toString());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const fuelCapNum = Number(fuelCapacity);
    const fuelCurNum = Number(currentFuel);
    const mileageNum = Number(mileage);

    if (isNaN(fuelCapNum) || isNaN(fuelCurNum) || isNaN(mileageNum)) {
      setFormError('Fuel capacity, Current fuel, and Mileage must be valid numbers');
      return;
    }

    if (fuelCurNum > fuelCapNum) {
      setFormError('Current fuel levels cannot exceed physical fuel capacity');
      return;
    }

    const vehicleData = {
      name,
      plateNumber,
      type,
      status,
      fuelCapacity: fuelCapNum,
      currentFuel: fuelCurNum,
      mileage: mileageNum
    };

    try {
      if (editingVehicle) {
        await onUpdateVehicle(editingVehicle._id, vehicleData);
      } else {
        await onCreateVehicle(vehicleData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit vehicle data');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you absolutely sure you want to remove this vehicle from active logs?')) {
      try {
        await onDeleteVehicle(id);
      } catch (err: any) {
        alert(err.message || 'Deletion error');
      }
    }
  };

  // Filter lists
  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) || 
                          v.plateNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || v.status === statusFilter;
    const matchesType = typeFilter === '' || v.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusStyle = (vStatus: string) => {
    switch (vStatus) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'On Trip':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'In Shop':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Retired':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getStatusIcon = (vStatus: string) => {
    switch (vStatus) {
      case 'Available':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'On Trip':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'In Shop':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'Retired':
        return <MinusCircle className="w-3.5 h-3.5" />;
      default:
        return null;
    }
  };

  const canModify = userRole === 'admin' || userRole === 'dispatcher';

  return (
    <div className="space-y-6" id="vehicles-view-root">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="vehicles-header">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Vehicle Fleet Register</h2>
          <p className="text-sm text-slate-400">Add, monitor, update and filter commercial vehicles registered on the platform.</p>
        </div>
        {canModify && (
          <button
            id="register-vehicle-btn"
            onClick={openCreateModal}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Register Vehicle
          </button>
        )}
      </div>

      {/* Control Filters */}
      <div className="bg-[#0a0a15]/80 p-4 rounded-2xl border border-slate-800/80 shadow-md flex flex-col md:flex-row gap-4 justify-between" id="vehicles-filter-bar">
        {/* Search */}
        <div className="relative flex-1" id="vehicles-search-container">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="vehicle-search-input"
            type="text"
            placeholder="Search by name, model or plate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#050508] border border-slate-800 rounded-xl focus:ring-2 focus:ring-cyan-500/30 focus:border-transparent outline-none text-sm text-slate-200 placeholder-slate-600"
          />
        </div>

        {/* Multi-Filters */}
        <div className="flex flex-wrap gap-2" id="vehicles-filters">
          <div className="flex items-center gap-1.5 bg-[#050508] px-3 py-2 rounded-xl border border-slate-800" id="filter-type-box">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="filter-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-300 outline-none pr-2 cursor-pointer"
            >
              <option value="" className="bg-[#0a0a15] text-slate-300">All Types</option>
              <option value="Truck" className="bg-[#0a0a15] text-slate-300">Truck</option>
              <option value="Van" className="bg-[#0a0a15] text-slate-300">Van</option>
              <option value="Bus" className="bg-[#0a0a15] text-slate-300">Bus</option>
              <option value="Car" className="bg-[#0a0a15] text-slate-300">Car</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#050508] px-3 py-2 rounded-xl border border-slate-800" id="filter-status-box">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              id="filter-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold text-slate-300 outline-none pr-2 cursor-pointer"
            >
              <option value="" className="bg-[#0a0a15] text-slate-300">All Statuses</option>
              <option value="Available" className="bg-[#0a0a15] text-slate-300">Available</option>
              <option value="On Trip" className="bg-[#0a0a15] text-slate-300">On Trip</option>
              <option value="In Shop" className="bg-[#0a0a15] text-slate-300">In Shop</option>
              <option value="Retired" className="bg-[#0a0a15] text-slate-300">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fleet Grid */}
      {filteredVehicles.length === 0 ? (
        <div className="py-20 text-center bg-[#0a0a15]/80 border border-slate-800/80 rounded-2xl shadow-sm" id="vehicles-empty-state">
          <Truck className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 font-medium">No vehicles match your search or filter configuration.</p>
          <button 
            id="clear-filters-btn"
            onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter(''); }} 
            className="mt-3 text-xs text-cyan-400 font-semibold hover:underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="vehicles-grid">
          {filteredVehicles.map((vehicle) => {
            const fuelPercentage = Math.round((vehicle.currentFuel / vehicle.fuelCapacity) * 100);
            return (
              <div key={vehicle._id} className="bg-[#0a0a15]/80 rounded-2xl border border-slate-800/80 p-5 shadow-lg hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300 flex flex-col justify-between" id={`vehicle-card-${vehicle._id}`}>
                {/* Header info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="p-3 bg-[#050508] text-slate-300 rounded-xl border border-slate-800/80">
                      <Truck className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${getStatusStyle(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                      {vehicle.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{vehicle.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400">
                      <span className="font-mono bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold">{vehicle.plateNumber}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-300">{vehicle.type}</span>
                    </div>
                  </div>
                </div>

                {/* Core operational readings */}
                <div className="mt-5 space-y-3.5 pt-4 border-t border-slate-800/60">
                  {/* Fuel gauge progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                      <span>Fuel Levels</span>
                      <span>{vehicle.currentFuel} / {vehicle.fuelCapacity} L ({fuelPercentage}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          fuelPercentage < 20 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : fuelPercentage < 50 ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' : 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                        }`}
                        style={{ width: `${fuelPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Mileage & last service logs */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-500">Total Mileage</span>
                      <span className="font-mono font-bold text-slate-300 text-sm">{vehicle.mileage.toLocaleString()} mi</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Last Service Date</span>
                      <span className="font-bold text-slate-300">{vehicle.lastMaintenanceDate || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Admin adjustments panel */}
                {canModify && (
                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex justify-end gap-1.5" id={`vehicle-actions-${vehicle._id}`}>
                    <button
                      id={`edit-vehicle-btn-${vehicle._id}`}
                      onClick={() => openEditModal(vehicle)}
                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-all cursor-pointer"
                      title="Edit vehicle attributes"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {userRole === 'admin' && (
                      <button
                        id={`delete-vehicle-btn-${vehicle._id}`}
                        onClick={() => handleDelete(vehicle._id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                        title="Delete vehicle"
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

      {/* Register/Edit Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#050508]/75 backdrop-blur-md z-50 flex items-center justify-center p-4" id="vehicle-modal-backdrop">
          <div className="bg-[#0a0a15] w-full max-w-lg rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden" id="vehicle-modal-card">
            {/* Header */}
            <div className="px-6 py-4 bg-[#050508]/40 border-b border-slate-800/80 flex justify-between items-center" id="vehicle-modal-header">
              <h3 className="font-bold text-white text-lg">
                {editingVehicle ? `Edit ${editingVehicle.name}` : 'Register New Fleet Vehicle'}
              </h3>
              <button 
                id="close-vehicle-modal-btn"
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error alerts */}
            {formError && (
              <div className="mx-6 mt-4 p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2" id="vehicle-form-error">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4" id="vehicle-form">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-name">Vehicle Model / Name</label>
                  <input
                    id="veh-name"
                    type="text"
                    required
                    placeholder="Volvo FH16 Globetrotter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-plate">License Plate Number</label>
                  <input
                    id="veh-plate"
                    type="text"
                    required
                    placeholder="TX-8902-TR"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-type">Vehicle Type</label>
                  <select
                    id="veh-type"
                    value={type}
                    onChange={(e: any) => setType(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                  >
                    <option value="Truck" className="bg-[#0a0a15] text-slate-300">Truck</option>
                    <option value="Van" className="bg-[#0a0a15] text-slate-300">Van</option>
                    <option value="Bus" className="bg-[#0a0a15] text-slate-300">Bus</option>
                    <option value="Car" className="bg-[#0a0a15] text-slate-300">Car</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-fuel-cap">Fuel Capacity (Liters)</label>
                  <input
                    id="veh-fuel-cap"
                    type="number"
                    required
                    placeholder="250"
                    value={fuelCapacity}
                    onChange={(e) => setFuelCapacity(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-current-fuel">Current Fuel Volume (L)</label>
                  <input
                    id="veh-current-fuel"
                    type="number"
                    required
                    placeholder="180"
                    value={currentFuel}
                    onChange={(e) => setCurrentFuel(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-mileage">Odometer Mileage (mi)</label>
                  <input
                    id="veh-mileage"
                    type="number"
                    required
                    placeholder="45000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5" htmlFor="veh-status">Operational Status</label>
                  <select
                    id="veh-status"
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#050508] border border-slate-800 text-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 text-sm cursor-pointer"
                  >
                    <option value="Available" className="bg-[#0a0a15] text-slate-300">Available</option>
                    <option value="On Trip" className="bg-[#0a0a15] text-slate-300">On Trip</option>
                    <option value="In Shop" className="bg-[#0a0a15] text-slate-300">In Shop</option>
                    <option value="Retired" className="bg-[#0a0a15] text-slate-300">Retired</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2" id="vehicle-form-actions">
                <button
                  id="cancel-vehicle-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-900 text-slate-400 font-semibold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-vehicle-btn"
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {editingVehicle ? 'Save Vehicle Modifications' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
