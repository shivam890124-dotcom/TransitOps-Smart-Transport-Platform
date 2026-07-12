import { Request, Response } from 'express';
import { VehicleModel, TripModel, MaintenanceModel } from '../config/db.js';

export async function getAllVehicles(req: Request, res: Response) {
  try {
    const { status, type, search } = req.query;
    let vehicles = await VehicleModel.find();

    if (status) {
      vehicles = vehicles.filter(v => v.status === status);
    }
    if (type) {
      vehicles = vehicles.filter(v => v.type === type);
    }
    if (search) {
      const searchStr = (search as string).toLowerCase();
      vehicles = vehicles.filter(v => 
        v.name.toLowerCase().includes(searchStr) || 
        v.plateNumber.toLowerCase().includes(searchStr)
      );
    }

    return res.json(vehicles);
  } catch (error: any) {
    console.error('Get Vehicles Error:', error);
    return res.status(500).json({ message: 'Error retrieving vehicles', error: error.message });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    return res.json(vehicle);
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving vehicle', error: error.message });
  }
}

export async function createVehicle(req: Request, res: Response) {
  try {
    const { name, plateNumber, type, fuelCapacity, currentFuel, mileage, status } = req.body;

    if (!name || !plateNumber || !type || fuelCapacity === undefined || currentFuel === undefined || mileage === undefined) {
      return res.status(400).json({ message: 'Please provide all required vehicle attributes' });
    }

    const existing = await VehicleModel.findOne({ plateNumber });
    if (existing) {
      return res.status(400).json({ message: 'A vehicle with this license plate number already exists' });
    }

    const newVehicle = await VehicleModel.create({
      name,
      plateNumber,
      type,
      status: status || 'Available',
      fuelCapacity: Number(fuelCapacity),
      currentFuel: Number(currentFuel),
      mileage: Number(mileage),
      lastMaintenanceDate: new Date().toISOString().split('T')[0]
    });

    return res.status(201).json(newVehicle);
  } catch (error: any) {
    console.error('Create Vehicle Error:', error);
    return res.status(500).json({ message: 'Error creating vehicle', error: error.message });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // If changing plate number, check uniqueness
    if (req.body.plateNumber && req.body.plateNumber !== vehicle.plateNumber) {
      const existing = await VehicleModel.findOne({ plateNumber: req.body.plateNumber });
      if (existing) {
        return res.status(400).json({ message: 'License plate already in use by another vehicle' });
      }
    }

    // Convert numeric strings if present
    const updateData = { ...req.body };
    if (updateData.fuelCapacity !== undefined) updateData.fuelCapacity = Number(updateData.fuelCapacity);
    if (updateData.currentFuel !== undefined) updateData.currentFuel = Number(updateData.currentFuel);
    if (updateData.mileage !== undefined) updateData.mileage = Number(updateData.mileage);

    const updated = await VehicleModel.findByIdAndUpdate(req.params.id, updateData);
    return res.json(updated);
  } catch (error: any) {
    console.error('Update Vehicle Error:', error);
    return res.status(500).json({ message: 'Error updating vehicle', error: error.message });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  try {
    const vehicle = await VehicleModel.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check if vehicle is assigned to active trips
    const activeTrips = await TripModel.find({ vehicleId: req.params.id, status: 'Dispatched' });
    if (activeTrips.length > 0) {
      return res.status(400).json({ message: 'Cannot delete vehicle. It is currently dispatched on an active trip' });
    }

    await VehicleModel.findByIdAndDelete(req.params.id);

    // Also remove any maintenance records for this vehicle to keep data tidy
    const maintenanceRecords = await MaintenanceModel.find({ vehicleId: req.params.id });
    for (const record of maintenanceRecords) {
      await MaintenanceModel.findByIdAndDelete(record._id);
    }

    return res.json({ message: 'Vehicle deleted successfully along with its maintenance history' });
  } catch (error: any) {
    console.error('Delete Vehicle Error:', error);
    return res.status(500).json({ message: 'Error deleting vehicle', error: error.message });
  }
}
