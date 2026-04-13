export type TestDriveStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export interface TestDriveCreateRequest {
  productCode: string;
  variantCode?: string;
  scheduledDate: string; // ISO 8601 format
  location: string;
  expectedDurationMinutes?: number;
  note?: string;
}

export interface TestDriveUpdateRequest {
  newScheduledDate: string;
  note?: string;
}

export interface TestDriveCancelRequest {
  cancellationReason: string;
}

export interface TestDriveDto {
  testDriveCode: string;
  customerCode: string;
  productCode: string;
  variantCode?: string;
  scheduledDate: string;
  location: string;
  expectedDurationMinutes: number;
  status: TestDriveStatus;
  assignedEmployeeCode?: string;
  note?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt?: string;
}
