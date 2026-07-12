import { useState, useEffect } from 'react';
import { 
  Truck, 
  UserCheck, 
  MapPin, 
  Wrench, 
  AlertCircle, 
  DollarSign, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp,
  Clock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { Vehicle, Driver, Trip, Maintenance } from '../types.js';

interface DashboardViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
  onNavigate: (tab: string) => void;
  onUpdateTrip: (tripId: string, newStatus: string) => void;
}

export default function DashboardView({ 
  vehicles, 
  drivers, 
  trips, 
  maintenance, 
  onNavigate,
  onUpdateTrip 
}: DashboardViewProps) {
  // Calculate stats
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  
  const inShopCount = vehicles.filter(v => v.status === 'In Shop').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;
  const retiredVehiclesCount = vehicles.filter(v => v.status === 'Retired').length;

  const totalMaintenanceCost = maintenance.reduce((sum, m) => sum + m.cost, 0);
  const activeMaintenanceCount = maintenance.filter(m => m.status !== 'Completed').length;

  const activeDriversCount = drivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;
  const suspendedDriversCount = drivers.filter(d => d.status === 'Suspended').length;

  // Driver License Expiry warning alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const expiredLicenseDrivers = drivers.filter(d => d.licenseExpiry < todayStr);

  // Chart data: Vehicle Status Breakdown
  const vehicleStatusData = [
    { name: 'Available', value: availableVehiclesCount, color: '#10b981' },
    { name: 'On Trip', value: vehicles.filter(v => v.status === 'On Trip').length, color: '#06b6d4' },
    { name: 'In Shop', value: inShopCount, color: '#f59e0b' },
    { name: 'Retired', value: retiredVehiclesCount, color: '#64748b' }
  ].filter(item => item.value > 0);

  // Chart data: Maintenance cost per vehicle type
  const typeCostMap: Record<string, number> = { Truck: 0, Van: 0, Bus: 0, Car: 0 };
  maintenance.forEach(m => {
    const vehicle = vehicles.find(v => v._id === m.vehicleId);
    if (vehicle) {
      typeCostMap[vehicle.type] = (typeCostMap[vehicle.type] || 0) + m.cost;
    }
  });
  const maintenanceCostData = Object.keys(typeCostMap).map(type => ({
    type,
    Cost: typeCostMap[type]
  }));

  // Find recent dispatched / pending trips
  const recentTrips = trips
    .filter(t => t.status === 'Dispatched' || t.status === 'Draft')
    .slice(0, 4);

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Upper Title Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="dashboard-header-row">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white" id="dashboard-view-title">Fleet Command Dashboard</h2>
          <p className="text-sm text-slate-400" id="dashboard-view-subtitle">Real-time status tracking, logistics analytics, and vehicle diagnostics.</p>
        </div>
        <div className="flex items-center gap-3 bg-[#0a0a15]/80 px-4 py-2 rounded-xl border border-slate-800/80" id="dashboard-time-badge">
          <Clock className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-mono font-semibold text-slate-300">Local: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Critical System Alerts / Warnings */}
      {(expiredLicenseDrivers.length > 0 || suspendedDriversCount > 0 || activeMaintenanceCount > 0) && (
        <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4" id="system-alerts-banner">
          <div className="flex items-start gap-3" id="alerts-text">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-400 text-sm">Action Required: Operations Flagged</h4>
              <ul className="text-xs text-amber-300 mt-1 list-disc pl-4 space-y-1">
                {expiredLicenseDrivers.map(d => (
                  <li key={d._id}>Driver <span className="font-semibold">{d.name}</span> Commercial License has expired ({d.licenseExpiry})</li>
                ))}
                {suspendedDriversCount > 0 && (
                  <li>There {suspendedDriversCount === 1 ? 'is 1 driver' : `are ${suspendedDriversCount} drivers`} currently under administrative suspension.</li>
                )}
                {inShopCount > 0 && (
                  <li>We have {inShopCount} heavy {inShopCount === 1 ? 'vehicle' : 'vehicles'} offline inside the maintenance shop.</li>
                )}
              </ul>
            </div>
          </div>
          <button 
            id="alerts-resolve-btn"
            onClick={() => onNavigate('drivers')} 
            className="text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            Resolve Expiries
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* KPI 1 */}
        <div className="bg-[#0a0a15]/80 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer" onClick={() => onNavigate('trips')} id="kpi-card-trips">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Dispatches</p>
            <h3 className="text-3xl font-bold text-white font-mono">{activeTripsCount}</h3>
            <p className="text-[10px] text-cyan-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Real-time route tracking
            </p>
          </div>
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#0a0a15]/80 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer" onClick={() => onNavigate('vehicles')} id="kpi-card-vehicles">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Fleet</p>
            <h3 className="text-3xl font-bold text-white font-mono">{availableVehiclesCount}<span className="text-xs text-slate-500 font-normal"> / {vehicles.length}</span></h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Ready for route assignment
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#0a0a15]/80 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer" onClick={() => onNavigate('drivers')} id="kpi-card-drivers">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Staff Operators</p>
            <h3 className="text-3xl font-bold text-white font-mono">{activeDriversCount}<span className="text-xs text-slate-500 font-normal"> / {drivers.length}</span></h3>
            <p className="text-[10px] text-indigo-400">Active and cleared to drive</p>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#0a0a15]/80 p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all cursor-pointer" onClick={() => onNavigate('maintenance')} id="kpi-card-maint">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Service Budget</p>
            <h3 className="text-3xl font-bold text-white font-mono">${totalMaintenanceCost}</h3>
            <p className="text-[10px] text-amber-400 font-semibold">{activeMaintenanceCount} pending work orders</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recharts Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-row">
        {/* Graph 1: Fleet breakdown */}
        <div className="bg-[#0a0a15]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm lg:col-span-1" id="chart-fleet-status-container">
          <h3 className="text-base font-bold text-slate-200 mb-4" id="chart-fleet-status-title">Fleet Allocation Status</h3>
          <div className="h-64" id="chart-pie-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vehicleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Vehicles`, 'Status']} 
                  contentStyle={{ backgroundColor: '#0a0a15', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Maintenance cost by type */}
        <div className="bg-[#0a0a15]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm lg:col-span-2" id="chart-maint-cost-container">
          <h3 className="text-base font-bold text-slate-200 mb-4" id="chart-maint-cost-title">Maintenance Cost by Vehicle Type ($)</h3>
          <div className="h-64" id="chart-bar-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceCostData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Expenditure']} 
                  contentStyle={{ backgroundColor: '#0a0a15', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="Cost" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {maintenanceCostData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.type === 'Truck' ? '#06b6d4' : entry.type === 'Van' ? '#3b82f6' : entry.type === 'Bus' ? '#a855f7' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Trips and Direct Operator Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-recent-row">
        {/* Active Dispatch Board */}
        <div className="bg-[#0a0a15]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm" id="active-dispatch-board">
          <div className="flex justify-between items-center mb-4" id="dispatch-board-header">
            <h3 className="text-base font-bold text-slate-200">Operational Dispatch Feeds</h3>
            <button 
              id="dispatch-view-all-btn"
              onClick={() => onNavigate('trips')} 
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Dispatch Desk <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTrips.length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800/80 rounded-xl bg-[#050508]/40" id="dispatch-board-empty">
              <Truck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">No pending or active dispatches currently registered.</p>
              <button 
                id="dispatch-now-btn"
                onClick={() => onNavigate('trips')} 
                className="mt-3 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Dispatch New Route
              </button>
            </div>
          ) : (
            <div className="space-y-3" id="dispatch-list">
              {recentTrips.map((trip) => (
                <div key={trip._id} className="p-4 bg-[#050508]/60 border border-slate-800/60 rounded-xl hover:bg-[#050508]/80 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">{trip.tripId}</span>
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        trip.status === 'Dispatched' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {trip.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>{trip.routeFrom}</span>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <span>{trip.routeTo}</span>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vehicle: <span className="font-semibold text-slate-300">{trip.vehicleName}</span> • Driver: <span className="font-semibold text-slate-300">{trip.driverName}</span>
                    </p>
                  </div>
                  {trip.status === 'Dispatched' && (
                    <button
                      id={`complete-trip-${trip._id}`}
                      onClick={() => onUpdateTrip(trip._id, 'Completed')}
                      className="w-full sm:w-auto text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Arrived
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Maintenance Shop Summary */}
        <div className="bg-[#0a0a15]/80 p-6 rounded-2xl border border-slate-800/80 shadow-sm" id="maintenance-shop-summary">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-slate-200">Maintenance Shop Floor</h3>
            <button 
              id="maint-shop-all-btn"
              onClick={() => onNavigate('maintenance')} 
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Diagnostics Desk <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {maintenance.filter(m => m.status !== 'Completed').length === 0 ? (
            <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-[#050508]/40">
              <Wrench className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="text-sm">Shop Floor is clear! All fleet vehicles fully certified.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {maintenance.filter(m => m.status !== 'Completed').slice(0, 3).map((order) => (
                <div key={order._id} className="p-4 border border-slate-800/60 bg-amber-500/5 rounded-xl flex items-start gap-3 hover:bg-amber-500/10 transition-all">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    order.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-200">{order.vehicleName}</h4>
                      <span className="text-[10px] font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{order.issue}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Scheduled: {order.scheduledDate}</span>
                      <span className="font-bold text-slate-300">${order.cost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
