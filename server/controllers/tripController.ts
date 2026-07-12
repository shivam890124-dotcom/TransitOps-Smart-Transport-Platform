import { Request, Response } from 'express';
import { TripModel, VehicleModel, DriverModel } from '../config/db.js';

export async function getAllTrips(req: Request, res: Response) {
  try {
    const { status, search } = req.query;
    let trips = await TripModel.find();

    if (status) {
      trips = trips.filter(t => t.status === status);
    }

    if (search) {
      const searchStr = (search as string).toLowerCase();
      trips = trips.filter(t => 
        t.tripId.toLowerCase().includes(searchStr) ||
        t.routeFrom.toLowerCase().includes(searchStr) ||
        t.routeTo.toLowerCase().includes(searchStr)
      );
    }

    // Populate driver and vehicle name/details dynamically for the frontend
    const vehicles = await VehicleModel.find();
    const drivers = await DriverModel.find();

    const populatedTrips = trips.map(trip => {
      const vehicle = vehicles.find(v => v._id === trip.vehicleId);
      const driver = drivers.find(d => d._id === trip.driverId);
      return {
        ...trip,
        vehicleName: vehicle ? `${vehicle.name} (${vehicle.plateNumber})` : 'Unknown Vehicle',
        driverName: driver ? driver.name : 'Unknown Driver'
      };
    });

    return res.json(populatedTrips);
  } catch (error: any) {
    console.error('Get Trips Error:', error);
    return res.status(500).json({ message: 'Error retrieving trips', error: error.message });
  }
}

export async function getTripById(req: Request, res: Response) {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const vehicle = await VehicleModel.findById(trip.vehicleId);
    const driver = await DriverModel.findById(trip.driverId);

    return res.json({
      ...trip,
      vehicleDetails: vehicle,
      driverDetails: driver
    });
  } catch (error: any) {
    return res.status(500).json({ message: 'Error retrieving trip', error: error.message });
  }
}

export async function createTrip(req: Request, res: Response) {
  try {
    const { vehicleId, driverId, routeFrom, routeTo, departureTime, estimatedArrivalTime, notes, status } = req.body;

    if (!vehicleId || !driverId || !routeFrom || !routeTo || !departureTime || !estimatedArrivalTime) {
      return res.status(400).json({ message: 'Please provide all required trip fields' });
    }

    // Retrieve and validate vehicle
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Retrieve and validate driver
    const driver = await DriverModel.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Business Rule Check: Reject expired license
    const todayStr = new Date().toISOString().split('T')[0];
    if (driver.licenseExpiry < todayStr) {
      return res.status(400).json({ 
        message: `Validation Error: Cannot assign driver. License (${driver.licenseExpiry}) is expired` 
      });
    }

    // If dispatching immediately, run trip conflict checks
    const targetStatus = status || 'Draft';
    if (targetStatus === 'Dispatched') {
      if (vehicle.status === 'On Trip') {
        return res.status(400).json({ message: 'Validation Error: Vehicle is already active on another trip' });
      }
      if (vehicle.status === 'In Shop') {
        return res.status(400).json({ message: 'Validation Error: Vehicle is currently undergoing maintenance in shop' });
      }
      if (vehicle.status === 'Retired') {
        return res.status(400).json({ message: 'Validation Error: Vehicle has been retired from active service' });
      }

      if (driver.status === 'On Trip') {
        return res.status(400).json({ message: 'Validation Error: Driver is already assigned to an active trip' });
      }
      if (driver.status === 'Suspended') {
        return res.status(400).json({ message: 'Validation Error: Driver is currently suspended from duty' });
      }
    }

    // Create unique Trip ID
    const tripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTrip = await TripModel.create({
      tripId,
      vehicleId,
      driverId,
      routeFrom,
      routeTo,
      status: targetStatus,
      departureTime,
      estimatedArrivalTime,
      actualArrivalTime: null,
      notes: notes || ''
    });

    // Business Rule Check: Auto update driver & vehicle status if dispatched
    if (targetStatus === 'Dispatched') {
      await VehicleModel.findByIdAndUpdate(vehicleId, { status: 'On Trip' });
      await DriverModel.findByIdAndUpdate(driverId, { status: 'On Trip' });
    }

    return res.status(201).json(newTrip);
  } catch (error: any) {
    console.error('Create Trip Error:', error);
    return res.status(500).json({ message: 'Error creating trip', error: error.message });
  }
}

export async function updateTripStatus(req: Request, res: Response) {
  try {
    const { status, actualArrivalTime } = req.body;
    const trip = await TripModel.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    const currentStatus = trip.status;
    if (currentStatus === status) {
      return res.json(trip);
    }

    const vehicle = await VehicleModel.findById(trip.vehicleId);
    const driver = await DriverModel.findById(trip.driverId);

    // Business rule checks when transiting to 'Dispatched'
    if (status === 'Dispatched') {
      if (vehicle && vehicle.status === 'On Trip' && currentStatus !== 'Dispatched') {
        return res.status(400).json({ message: 'Conflict: Vehicle is already assigned to another active trip' });
      }
      if (driver && driver.status === 'On Trip' && currentStatus !== 'Dispatched') {
        return res.status(400).json({ message: 'Conflict: Driver is already dispatched on another trip' });
      }
      if (driver) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (driver.licenseExpiry < todayStr) {
          return res.status(400).json({ message: `Safety Stop: Driver's commercial license is expired (${driver.licenseExpiry})` });
        }
      }

      // Update statuses
      if (vehicle) await VehicleModel.findByIdAndUpdate(trip.vehicleId, { status: 'On Trip' });
      if (driver) await DriverModel.findByIdAndUpdate(trip.driverId, { status: 'On Trip' });
    }

    // Handling completion
    let actualArrival = trip.actualArrivalTime;
    if (status === 'Completed') {
      actualArrival = actualArrivalTime || new Date().toISOString();
      // Free driver and vehicle
      if (vehicle) await VehicleModel.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });
      if (driver) await DriverModel.findByIdAndUpdate(trip.driverId, { status: 'Available' });
    }

    // Handling cancellation
    if (status === 'Cancelled' || status === 'Draft') {
      // If we are cancelling an active dispatch, free the resources
      if (currentStatus === 'Dispatched') {
        if (vehicle) await VehicleModel.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });
        if (driver) await DriverModel.findByIdAndUpdate(trip.driverId, { status: 'Available' });
      }
    }

    const updatedTrip = await TripModel.findByIdAndUpdate(req.params.id, {
      status,
      actualArrivalTime: actualArrival
    });

    return res.json(updatedTrip);
  } catch (error: any) {
    console.error('Update Trip Status Error:', error);
    return res.status(500).json({ message: 'Error updating trip status', error: error.message });
  }
}

export async function deleteTrip(req: Request, res: Response) {
  try {
    const trip = await TripModel.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // If deleted trip is active, reset status of associated resources
    if (trip.status === 'Dispatched') {
      await VehicleModel.findByIdAndUpdate(trip.vehicleId, { status: 'Available' });
      await DriverModel.findByIdAndUpdate(trip.driverId, { status: 'Available' });
    }

    await TripModel.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Trip record removed successfully' });
  } catch (error: any) {
    console.error('Delete Trip Error:', error);
    return res.status(500).json({ message: 'Error removing trip log', error: error.message });
  }
}
