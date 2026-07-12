export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'dispatcher' | 'manager';
  token?: string;
}

export interface Vehicle {
  _id: string;
  name: string;
  plateNumber: string;
  type: 'Truck' | 'Van' | 'Bus' | 'Car';
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
  fuelCapacity: number;
  currentFuel: number;
  mileage: number;
  lastMaintenanceDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string; // YYYY-MM-DD
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  _id: string;
  tripId: string;
  vehicleId: string;
  driverId: string;
  routeFrom: string;
  routeTo: string;
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
  departureTime: string;
  estimatedArrivalTime: string;
  actualArrivalTime: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields from backend:
  vehicleName?: string;
  driverName?: string;
}

export interface Maintenance {
  _id: string;
  vehicleId: string;
  issue: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  cost: number;
  scheduledDate: string;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated fields:
  vehicleName?: string;
  vehicleStatus?: string;
}
