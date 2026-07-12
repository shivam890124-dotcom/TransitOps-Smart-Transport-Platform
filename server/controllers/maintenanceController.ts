import { Request, Response } from 'express';
import { MaintenanceModel, VehicleModel } from '../config/db.js';

export async function getAllMaintenance(req: Request, res: Response) {
  try {
    const { status } = req.query;
    let records = await MaintenanceModel.find();

    if (status) {
      records = records.filter(r => r.status === status);
    }

    // Populate vehicle data
    const vehicles = await VehicleModel.find();
    const populated = records.map(rec => {
      const vehicle = vehicles.find(v => v._id === rec.vehicleId);
      return {
        ...rec,
        vehicleName: vehicle ? `${vehicle.name} (${vehicle.plateNumber})` : 'Unknown Vehicle',
        vehicleStatus: vehicle ? vehicle.status : 'Unknown'
      };
    });

    return res.json(populated);
  } catch (error: any) {
    console.error('Get Maintenance Error:', error);
    return res.status(500).json({ message: 'Error retrieving maintenance logs', error: error.message });
  }
}

export async function createMaintenance(req: Request, res: Response) {
  try {
    const { vehicleId, issue, status, cost, scheduledDate } = req.body;

    if (!vehicleId || !issue || !scheduledDate || cost === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    const targetStatus = status || 'Pending';

    const record = await MaintenanceModel.create({
      vehicleId,
      issue,
      status: targetStatus,
      cost: Number(cost),
      scheduledDate,
      completedDate: targetStatus === 'Completed' ? new Date().toISOString().split('T')[0] : null
    });

    // Business Rule Check: Auto transition vehicle status
    if (targetStatus === 'In Progress') {
      await VehicleModel.findByIdAndUpdate(vehicleId, { status: 'In Shop' });
    } else if (targetStatus === 'Completed') {
      await VehicleModel.findByIdAndUpdate(vehicleId, { 
        status: 'Available',
        lastMaintenanceDate: new Date().toISOString().split('T')[0]
      });
    }

    return res.status(201).json(record);
  } catch (error: any) {
    console.error('Create Maintenance Error:', error);
    return res.status(500).json({ message: 'Error creating maintenance log', error: error.message });
  }
}

export async function updateMaintenance(req: Request, res: Response) {
  try {
    const { status, issue, cost, scheduledDate, completedDate } = req.body;
    const record = await MaintenanceModel.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    const oldStatus = record.status;
    const newStatus = status || oldStatus;

    const updateData: any = {
      issue: issue !== undefined ? issue : record.issue,
      cost: cost !== undefined ? Number(cost) : record.cost,
      scheduledDate: scheduledDate !== undefined ? scheduledDate : record.scheduledDate,
      status: newStatus
    };

    // Set complete date on status transition
    if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      updateData.completedDate = completedDate || new Date().toISOString().split('T')[0];
    } else if (newStatus !== 'Completed') {
      updateData.completedDate = null;
    }

    const updated = await MaintenanceModel.findByIdAndUpdate(req.params.id, updateData);

    // Business Rule: Auto sync vehicle status
    if (newStatus === 'In Progress' && oldStatus !== 'In Progress') {
      await VehicleModel.findByIdAndUpdate(record.vehicleId, { status: 'In Shop' });
    } else if (newStatus === 'Completed' && oldStatus !== 'Completed') {
      await VehicleModel.findByIdAndUpdate(record.vehicleId, { 
        status: 'Available',
        lastMaintenanceDate: new Date().toISOString().split('T')[0]
      });
    } else if (oldStatus === 'In Progress' && (newStatus === 'Pending' || newStatus === 'Completed')) {
      // If it was in shop, set it available now
      await VehicleModel.findByIdAndUpdate(record.vehicleId, { status: 'Available' });
    }

    return res.json(updated);
  } catch (error: any) {
    console.error('Update Maintenance Error:', error);
    return res.status(500).json({ message: 'Error updating maintenance log', error: error.message });
  }
}

export async function deleteMaintenance(req: Request, res: Response) {
  try {
    const record = await MaintenanceModel.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: 'Maintenance record not found' });
    }

    // If the record was in progress, release the vehicle
    if (record.status === 'In Progress') {
      await VehicleModel.findByIdAndUpdate(record.vehicleId, { status: 'Available' });
    }

    await MaintenanceModel.findByIdAndDelete(req.params.id);
    return res.json({ message: 'Maintenance ticket removed successfully' });
  } catch (error: any) {
    console.error('Delete Maintenance Error:', error);
    return res.status(500).json({ message: 'Error removing maintenance ticket', error: error.message });
  }
}
