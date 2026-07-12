import { Request, Response } from 'express';
import { DriverModel, TripModel } from '../config/db.js';

export async function getAllDrivers(req: Request, res: Response) {
  try {
    const { status, search } = req.query;
    let drivers = await DriverModel.find();

    if (status) {
      drivers = drivers.filter(d => d.status === status);
    }
    if (search) {
      const searchStr = (search as string).toLowerCase();
      drivers = drivers.filter(d => 
        d.name.toLowerCase().includes(searchStr) || 
        d.email.toLowerCase().includes(searchStr) ||
        d.licenseNumber.toLowerCase().includes(searchStr)
      );
    }

    return res.json(drivers);
  } catch (error: any) {
    console.error('Get Drivers Error:', error);
    return res.status(500).json({ message: 'Error retrieving drivers', error: error.message });
  }
}

export async function getDriverById(req: Request, res: Response) {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }
    return res.json(driver);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving driver', error: error.message });
  }
}

export async function createDriver(req: Request, res: Response) {
  try {
    const { name, email, phone, licenseNumber, licenseExpiry, status } = req.body;

    if (!name || !email || !phone || !licenseNumber || !licenseExpiry) {
      return res.status(400).json({ message: 'Please provide all required driver credentials' });
    }

    const existingEmail = await DriverModel.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'A driver with this email already exists' });
    }

    const existingLicense = await DriverModel.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({ message: 'License number already registered' });
    }

    const newDriver = await DriverModel.create({
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiry,
      status: status || 'Available'
    });

    return res.status(201).json(newDriver);
  } catch (error: any) {
    console.error('Create Driver Error:', error);
    return res.status(500).json({ message: 'Error registering driver', error: error.message });
  }
}

export async function updateDriver(req: Request, res: Response) {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check unique fields if they are being updated
    if (req.body.email && req.body.email !== driver.email) {
      const existing = await DriverModel.findOne({ email: req.body.email });
      if (existing) {
        return res.status(400).json({ message: 'Email address already in use by another driver' });
      }
    }

    if (req.body.licenseNumber && req.body.licenseNumber !== driver.licenseNumber) {
      const existing = await DriverModel.findOne({ licenseNumber: req.body.licenseNumber });
      if (existing) {
        return res.status(400).json({ message: 'License number already registered to another driver' });
      }
    }

    const updated = await DriverModel.findByIdAndUpdate(req.params.id, req.body);
    return res.json(updated);
  } catch (error: any) {
    console.error('Update Driver Error:', error);
    return res.status(500).json({ message: 'Error updating driver profile', error: error.message });
  }
}

export async function deleteDriver(req: Request, res: Response) {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Check if driver is on active dispatch
    const activeTrips = await TripModel.find({ driverId: req.params.id, status: 'Dispatched' });
    if (activeTrips.length > 0) {
      return res.status(400).json({ message: 'Cannot delete driver. Operator is currently dispatched on an active trip' });
    }

    await DriverModel.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Driver profile deleted successfully' });
  } catch (error: any) {
    console.error('Delete Driver Error:', error);
    return res.status(500).json({ message: 'Error deleting driver', error: error.message });
  }
}
