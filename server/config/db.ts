import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

const DB_DIR = path.join(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Interface structures
export interface User {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'dispatcher' | 'manager';
  createdAt: string;
  updatedAt: string;
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
}

// Global flag to track active database state
export let isMongoConnected = false;

// Mongoose Schemas representing MERN Models
const UserSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'dispatcher', 'manager'], default: 'dispatcher' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const VehicleSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Truck', 'Van', 'Bus', 'Car'], required: true },
  status: { type: String, enum: ['Available', 'On Trip', 'In Shop', 'Retired'], default: 'Available' },
  fuelCapacity: { type: Number, required: true },
  currentFuel: { type: Number, required: true },
  mileage: { type: Number, required: true },
  lastMaintenanceDate: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const DriverSchema = new Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  licenseNumber: { type: String, required: true, unique: true },
  licenseExpiry: { type: String, required: true },
  status: { type: String, enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'], default: 'Available' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const TripSchema = new Schema({
  _id: { type: String, required: true },
  tripId: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true },
  driverId: { type: String, required: true },
  routeFrom: { type: String, required: true },
  routeTo: { type: String, required: true },
  status: { type: String, enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'], default: 'Draft' },
  departureTime: { type: String, required: true },
  estimatedArrivalTime: { type: String, required: true },
  actualArrivalTime: { type: String, default: null },
  notes: { type: String, default: '' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const MaintenanceSchema = new Schema({
  _id: { type: String, required: true },
  vehicleId: { type: String, required: true },
  issue: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  cost: { type: Number, required: true },
  scheduledDate: { type: String, required: true },
  completedDate: { type: String, default: null },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// Compile Mongoose models
export const UserMongooseModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const VehicleMongooseModel = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
export const DriverMongooseModel = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);
export const TripMongooseModel = mongoose.models.Trip || mongoose.model('Trip', TripSchema);
export const MaintenanceMongooseModel = mongoose.models.Maintenance || mongoose.model('Maintenance', MaintenanceSchema);

// Seeding Data Definition
function getSeedData(): {
  users: User[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenance: Maintenance[];
} {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  return {
    users: [
      {
        _id: 'user-admin',
        name: 'Chief Dispatcher',
        email: 'admin@transitops.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'user-dispatcher',
        name: 'Sarah Jenkins',
        email: 'sarah@transitops.com',
        password: hashedPassword,
        role: 'dispatcher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    vehicles: [
      {
        _id: 'veh-101',
        name: 'Volvo FH16 Semi Truck',
        plateNumber: 'TX-8902-TR',
        type: 'Truck',
        status: 'Available',
        fuelCapacity: 400,
        currentFuel: 320,
        mileage: 45200,
        lastMaintenanceDate: '2026-05-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'veh-102',
        name: 'Ford Transit Cargo Van',
        plateNumber: 'CA-4102-VN',
        type: 'Van',
        status: 'On Trip',
        fuelCapacity: 120,
        currentFuel: 85,
        mileage: 21800,
        lastMaintenanceDate: '2026-06-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'veh-103',
        name: 'Scania R500 Flatbed',
        plateNumber: 'NY-2391-TR',
        type: 'Truck',
        status: 'In Shop',
        fuelCapacity: 350,
        currentFuel: 110,
        mileage: 89000,
        lastMaintenanceDate: '2026-07-08',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'veh-104',
        name: 'Mercedes-Benz Sprinter',
        plateNumber: 'FL-5112-VN',
        type: 'Van',
        status: 'Retired',
        fuelCapacity: 100,
        currentFuel: 10,
        mileage: 245000,
        lastMaintenanceDate: '2025-11-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    drivers: [
      {
        _id: 'drv-101',
        name: 'Alexander Russo',
        email: 'alex.russo@transitops.com',
        phone: '+1 (555) 102-3921',
        licenseNumber: 'TX-DL-99210',
        licenseExpiry: '2028-10-15',
        status: 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'drv-102',
        name: 'Jane Smith',
        email: 'jane.smith@transitops.com',
        phone: '+1 (555) 283-4902',
        licenseNumber: 'CA-DL-29381',
        licenseExpiry: '2027-11-20',
        status: 'On Trip',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'drv-103',
        name: 'Marcus Vance',
        email: 'marcus.vance@transitops.com',
        phone: '+1 (555) 304-8192',
        licenseNumber: 'NY-DL-11883',
        licenseExpiry: '2025-05-14',
        status: 'Suspended',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'drv-104',
        name: 'Elena Rostova',
        email: 'elena.r@transitops.com',
        phone: '+1 (555) 485-2901',
        licenseNumber: 'FL-DL-44889',
        licenseExpiry: '2029-01-30',
        status: 'Off Duty',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    trips: [
      {
        _id: 'trip-1001',
        tripId: 'TRIP-7492',
        vehicleId: 'veh-102',
        driverId: 'drv-102',
        routeFrom: 'Dallas Distribution Hub',
        routeTo: 'Houston Retail Outlets',
        status: 'Dispatched',
        departureTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        estimatedArrivalTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        actualArrivalTime: null,
        notes: 'High-priority delivery of temperature-sensitive cargo.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'trip-1002',
        tripId: 'TRIP-1290',
        vehicleId: 'veh-101',
        driverId: 'drv-101',
        routeFrom: 'Austin Logistics Yard',
        routeTo: 'San Antonio Warehouse',
        status: 'Completed',
        departureTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        estimatedArrivalTime: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
        actualArrivalTime: new Date(Date.now() - 21 * 3600 * 1000).toISOString(),
        notes: 'Standard auto parts delivery completed without issues.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    maintenance: [
      {
        _id: 'maint-101',
        vehicleId: 'veh-103',
        issue: 'Hydraulic leak check and transmission diagnostic.',
        status: 'In Progress',
        cost: 1250,
        scheduledDate: '2026-07-08',
        completedDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        _id: 'maint-102',
        vehicleId: 'veh-101',
        issue: 'Routine 10,000-mile engine oil and air filter replacement.',
        status: 'Completed',
        cost: 320,
        scheduledDate: '2026-05-10',
        completedDate: '2026-05-10',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  };
}

// Seed MongoDB collections
async function seedMongo() {
  try {
    const userCount = await UserMongooseModel.countDocuments();
    if (userCount === 0) {
      console.log('MongoDB is empty. Seeding initial TransitOps logistical assets...');
      const seed = getSeedData();
      await UserMongooseModel.insertMany(seed.users as any[]);
      await VehicleMongooseModel.insertMany(seed.vehicles as any[]);
      await DriverMongooseModel.insertMany(seed.drivers as any[]);
      await TripMongooseModel.insertMany(seed.trips as any[]);
      await MaintenanceMongooseModel.insertMany(seed.maintenance as any[]);
      console.log('MongoDB successfully seeded with standard operations logs.');
    }
  } catch (err: any) {
    console.error('Failed to seed MongoDB:', err);
  }
}

// Mock Database local file initializer
function initMockDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = getSeedData();
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log('Local fallback JSON database seeded at:', DB_FILE);
  }
}

// Global DB initializer called in server.ts
export async function initDb() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.warn('⚡ WARNING: "MONGODB_URI" environment variable is not defined.');
    console.log('🔌 TransitOps backend falling back to SECURE local file storage.');
    initMockDb();
    return;
  }

  console.log(`🔌 Attempting to connect to MongoDB cluster...`);
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000
    });
    isMongoConnected = true;
    console.log('🚀 SUCCESS: Connected to MongoDB database successfully.');
    await seedMongo();
  } catch (error: any) {
    console.error('❌ Mongoose connection failed:', error.message);
    console.log('🔌 Falling back to local JSON file storage for safety.');
    initMockDb();
  }
}

// Generic Mock Mongoose database model mimicking mongoose queries
export class MockModel<T extends { _id: string }> {
  private key: 'users' | 'vehicles' | 'drivers' | 'trips' | 'maintenance';

  constructor(key: 'users' | 'vehicles' | 'drivers' | 'trips' | 'maintenance') {
    this.key = key;
  }

  private loadAll(): T[] {
    initMockDb();
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      return data[this.key] || [];
    } catch {
      return [];
    }
  }

  private saveAll(items: T[]) {
    initMockDb();
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      data[this.key] = items;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving mock file:', err);
    }
  }

  async find(filter: Partial<T> = {}): Promise<T[]> {
    const list = this.loadAll();
    return list.filter(item => {
      for (const k in filter) {
        if (filter[k] !== undefined && item[k] !== filter[k]) {
          return false;
        }
      }
      return true;
    });
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    const list = this.loadAll();
    const found = list.find(item => {
      for (const k in filter) {
        if (filter[k] !== undefined && item[k] !== filter[k]) {
          return false;
        }
      }
      return true;
    });
    return found || null;
  }

  async findById(id: string): Promise<T | null> {
    const list = this.loadAll();
    return list.find(item => item._id === id) || null;
  }

  async create(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const list = this.loadAll();
    const newDoc = {
      ...doc,
      _id: `${this.key.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as unknown as T;

    list.push(newDoc);
    this.saveAll(list);
    return newDoc;
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options = { new: true }): Promise<T | null> {
    const list = this.loadAll();
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...update,
      updatedAt: new Date().toISOString()
    } as T;

    list[index] = updated;
    this.saveAll(list);
    return updated;
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const list = this.loadAll();
    const index = list.findIndex(item => item._id === id);
    if (index === -1) return null;

    const [deleted] = list.splice(index, 1);
    this.saveAll(list);
    return deleted;
  }
}

// Proxy wrapper that routes queries seamlessly to MongoDB or Mock JSON File
export class MernModel<T extends { _id: string }> {
  private key: 'users' | 'vehicles' | 'drivers' | 'trips' | 'maintenance';
  private mongooseModel: mongoose.Model<any>;
  private mockModel: MockModel<T>;

  constructor(
    key: 'users' | 'vehicles' | 'drivers' | 'trips' | 'maintenance',
    mongooseModel: mongoose.Model<any>
  ) {
    this.key = key;
    this.mongooseModel = mongooseModel;
    this.mockModel = new MockModel<T>(key);
  }

  async find(filter: Partial<T> = {}): Promise<T[]> {
    if (isMongoConnected) {
      const docs = await this.mongooseModel.find(filter).lean();
      return docs as unknown as T[];
    } else {
      return this.mockModel.find(filter);
    }
  }

  async findOne(filter: Partial<T>): Promise<T | null> {
    if (isMongoConnected) {
      const doc = await this.mongooseModel.findOne(filter).lean();
      return doc as unknown as T | null;
    } else {
      return this.mockModel.findOne(filter);
    }
  }

  async findById(id: string): Promise<T | null> {
    if (isMongoConnected) {
      const doc = await this.mongooseModel.findById(id).lean();
      return doc as unknown as T | null;
    } else {
      return this.mockModel.findById(id);
    }
  }

  async create(doc: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    if (isMongoConnected) {
      const id = `${this.key.substring(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;
      const newDoc = await this.mongooseModel.create({
        _id: id,
        ...doc,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      return newDoc.toObject() as unknown as T;
    } else {
      return this.mockModel.create(doc);
    }
  }

  async findByIdAndUpdate(id: string, update: Partial<T>, options = { new: true }): Promise<T | null> {
    if (isMongoConnected) {
      const updated = await this.mongooseModel.findByIdAndUpdate(
        id,
        { ...update, updatedAt: new Date().toISOString() },
        { new: true }
      ).lean();
      return updated as unknown as T | null;
    } else {
      return this.mockModel.findByIdAndUpdate(id, update, options);
    }
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    if (isMongoConnected) {
      const deleted = await this.mongooseModel.findByIdAndDelete(id).lean();
      return deleted as unknown as T | null;
    } else {
      return this.mockModel.findByIdAndDelete(id);
    }
  }
}

// Instantiated database models used throughout controller code
export const UserModel = new MernModel<User>('users', UserMongooseModel);
export const VehicleModel = new MernModel<Vehicle>('vehicles', VehicleMongooseModel);
export const DriverModel = new MernModel<Driver>('drivers', DriverMongooseModel);
export const TripModel = new MernModel<Trip>('trips', TripMongooseModel);
export const MaintenanceModel = new MernModel<Maintenance>('maintenance', MaintenanceMongooseModel);
