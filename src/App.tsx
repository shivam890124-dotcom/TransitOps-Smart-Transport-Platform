import { useState, useEffect } from 'react';
import { User, Vehicle, Driver, Trip, Maintenance } from './types.js';
import { api } from './utils/api.js';

// Visual Views
import AuthScreen from './components/AuthScreen.js';
import DashboardView from './components/DashboardView.js';
import VehicleView from './components/VehicleView.js';
import DriverView from './components/DriverView.js';
import TripView from './components/TripView.js';
import MaintenanceView from './components/MaintenanceView.js';

// Icons
import { 
  Truck, 
  LogOut, 
  LayoutDashboard, 
  UserCheck, 
  MapPin, 
  Wrench, 
  Shield, 
  Menu, 
  X 
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Fleet Core State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchingData, setFetchingData] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Authentication session check on mount
  useEffect(() => {
    const cachedUser = localStorage.getItem('transit_user');
    const token = localStorage.getItem('transit_token');

    if (cachedUser && token) {
      setCurrentUser(JSON.parse(cachedUser));
      // Validate token with a backend profile call
      api.auth.profile()
        .then((profile) => {
          // Token is valid, merge and update state
          setCurrentUser(prev => prev ? { ...prev, ...profile } : profile);
        })
        .catch((err) => {
          console.warn('Session verification failed, logging out:', err);
          handleLogout();
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch complete fleet data if user is logged in
  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser]);

  const fetchAllData = async () => {
    setFetchingData(true);
    try {
      const [vehiclesList, driversList, tripsList, maintenanceList] = await Promise.all([
        api.vehicles.list(),
        api.drivers.list(),
        api.trips.list(),
        api.maintenance.list()
      ]);

      setVehicles(vehiclesList);
      setDrivers(driversList);
      setTrips(tripsList);
      setMaintenance(maintenanceList);
    } catch (error) {
      console.error('Error synchronizing platform data:', error);
    } finally {
      setLoading(false);
      setFetchingData(false);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('transit_user');
    localStorage.removeItem('transit_token');
    setCurrentUser(null);
    setVehicles([]);
    setDrivers([]);
    setTrips([]);
    setMaintenance([]);
    setLoading(false);
  };

  // State Synchronizers (Mutators)
  const handleCreateVehicle = async (data: any) => {
    await api.vehicles.create(data);
    await fetchAllData();
  };

  const handleUpdateVehicle = async (id: string, data: any) => {
    await api.vehicles.update(id, data);
    await fetchAllData();
  };

  const handleDeleteVehicle = async (id: string) => {
    await api.vehicles.delete(id);
    await fetchAllData();
  };

  const handleCreateDriver = async (data: any) => {
    await api.drivers.create(data);
    await fetchAllData();
  };

  const handleUpdateDriver = async (id: string, data: any) => {
    await api.drivers.update(id, data);
    await fetchAllData();
  };

  const handleDeleteDriver = async (id: string) => {
    await api.drivers.delete(id);
    await fetchAllData();
  };

  const handleCreateTrip = async (data: any) => {
    await api.trips.create(data);
    await fetchAllData();
  };

  const handleUpdateTripStatus = async (id: string, status: string, actualArrivalTime?: string) => {
    await api.trips.updateStatus(id, status, actualArrivalTime);
    await fetchAllData();
  };

  const handleDeleteTrip = async (id: string) => {
    await api.trips.delete(id);
    await fetchAllData();
  };

  const handleCreateMaintenance = async (data: any) => {
    await api.maintenance.create(data);
    await fetchAllData();
  };

  const handleUpdateMaintenance = async (id: string, data: any) => {
    await api.maintenance.update(id, data);
    await fetchAllData();
  };

  const handleDeleteMaintenance = async (id: string) => {
    await api.maintenance.delete(id);
    await fetchAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050508] text-white space-y-4" id="platform-loader">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        <div className="text-center">
          <h2 className="text-lg font-bold font-display tracking-wide text-white">Transit<span className="text-cyan-400">Ops</span> Control Tower</h2>
          <p className="text-xs text-slate-400 mt-1">Establishing encrypted handshake and initializing fleet matrices...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vehicles', label: 'Vehicles Fleet', icon: Truck },
    { id: 'drivers', label: 'Drivers Staff', icon: UserCheck },
    { id: 'trips', label: 'Dispatch Center', icon: MapPin },
    { id: 'maintenance', label: 'Repair Shop', icon: Wrench }
  ];

  return (
    <div className="min-h-screen flex bg-[#050508] text-slate-300 font-sans" id="app-root">
      
      {/* Dynamic Desktop Sidebar / Mobile Panel Drawer */}
      <aside 
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 bg-[#0a0a15] text-slate-300 w-64 border-r border-slate-800/50 z-40 transition-transform duration-300 transform lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-[#0a0a15]/80" id="sidebar-header">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Truck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="font-bold text-base font-display tracking-tight text-white leading-none italic">Transit<span className="text-cyan-400">Ops</span></h1>
              <span className="text-[10px] text-slate-500 font-mono">OPERATIONS PLATFORM</span>
            </div>
          </div>
          <button 
            id="close-sidebar-mobile-btn"
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items links */}
        <nav className="p-4 space-y-1.5" id="sidebar-navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => {
                  setCurrentTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' 
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User context footer and logout */}
        <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-800 bg-[#0a0a15]" id="sidebar-footer">
          <div className="p-3 bg-slate-900/50 rounded-xl mb-3 flex items-start gap-2.5 border border-slate-800">
            <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-xs text-cyan-400 border border-slate-700">
              {currentUser.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate leading-tight">{currentUser.name}</h4>
              <span className="text-[9px] font-mono font-bold text-slate-400 flex items-center gap-1 mt-1 uppercase">
                <Shield className="w-2.5 h-2.5 text-cyan-400" /> {currentUser.role}
              </span>
            </div>
          </div>

          <button
            id="app-logout-btn"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 bg-slate-900/50 hover:bg-rose-950/20 hover:text-rose-400 text-slate-400 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Screen Backdrop Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          id="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        ></div>
      )}

      {/* Primary Work Desk Canvas */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen bg-[#050508] bg-[radial-gradient(circle_at_top_right,_#111122_0%,_#050508_40%)]" id="app-canvas-container">
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-800/50 bg-[#050508]/40 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between" id="app-canvas-header">
          <div className="flex items-center gap-4">
            <button
              id="open-sidebar-mobile-btn"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Control Desk Feed</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
                <span className="text-xs text-slate-400 font-semibold">All dispatch systems synchronized</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {fetchingData && (
              <span className="text-xs text-cyan-400 flex items-center gap-1.5 font-medium animate-pulse" id="syncing-indicator">
                <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping"></span>
                Refreshing logs...
              </span>
            )}
            <button 
              id="refresh-logs-btn"
              onClick={fetchAllData} 
              className="text-xs font-semibold text-slate-400 hover:text-cyan-400 hover:bg-slate-900/60 px-3 py-1.5 rounded-lg transition-all"
            >
              Sync Records
            </button>
          </div>
        </header>

        {/* Active Tab Component Body Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto" id="app-canvas-content">
          {currentTab === 'dashboard' && (
            <DashboardView 
              vehicles={vehicles}
              drivers={drivers}
              trips={trips}
              maintenance={maintenance}
              onNavigate={setCurrentTab}
              onUpdateTrip={handleUpdateTripStatus}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehicleView 
              vehicles={vehicles}
              userRole={currentUser.role}
              onCreateVehicle={handleCreateVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {currentTab === 'drivers' && (
            <DriverView 
              drivers={drivers}
              userRole={currentUser.role}
              onCreateDriver={handleCreateDriver}
              onUpdateDriver={handleUpdateDriver}
              onDeleteDriver={handleDeleteDriver}
            />
          )}

          {currentTab === 'trips' && (
            <TripView 
              trips={trips}
              vehicles={vehicles}
              drivers={drivers}
              userRole={currentUser.role}
              onCreateTrip={handleCreateTrip}
              onUpdateTripStatus={handleUpdateTripStatus}
              onDeleteTrip={handleDeleteTrip}
            />
          )}

          {currentTab === 'maintenance' && (
            <MaintenanceView 
              maintenance={maintenance}
              vehicles={vehicles}
              userRole={currentUser.role}
              onCreateMaintenance={handleCreateMaintenance}
              onUpdateMaintenance={handleUpdateMaintenance}
              onDeleteMaintenance={handleDeleteMaintenance}
            />
          )}
        </main>
      </div>

    </div>
  );
}
