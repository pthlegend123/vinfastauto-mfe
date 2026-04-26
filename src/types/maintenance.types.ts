export type MaintenanceServiceType =
  | 'PERIODIC_MAINTENANCE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'TIRE_CHANGE'
  | 'BATTERY_CHECK';

export type MaintenanceStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MaintenanceBookingDto {
  bookingCode: string;
  customerCode: string;
  customerName?: string;
  technicianCode?: string;
  technicianName?: string;
  serviceType: MaintenanceServiceType;
  showroom: string;
  scheduledDate: string;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  notes?: string;
  cancellationReason?: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMaintenanceBookingRequest {
  serviceType: MaintenanceServiceType;
  showroom: string;
  scheduledDate: string;
  licensePlate?: string;
  vin?: string;
  mileage?: number;
  notes?: string;
}

export interface MaintenanceCancelRequest {
  cancellationReason: string;
}
