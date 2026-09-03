import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum VehicleTypeEnum {
  BUS = 'BUS',
  MINI_BUS = 'MINI_BUS',
  VAN = 'VAN',
  AMBULANCE = 'AMBULANCE',
  CAR = 'CAR',
}

export enum FuelTypeEnum {
  DIESEL = 'DIESEL',
  CNG = 'CNG',
  ELECTRIC = 'ELECTRIC',
  PETROL = 'PETROL',
}

export enum VehicleStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  EXPIRED = 'EXPIRED',
  RETIRED = 'RETIRED',
}

export enum DriverStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleDocumentTypeEnum {
  RC = 'RC',
  INSURANCE = 'INSURANCE',
  FITNESS = 'FITNESS',
  PERMIT = 'PERMIT',
  POLLUTION = 'POLLUTION',
  OTHER = 'OTHER',
}

export enum DriverDocumentTypeEnum {
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
  POLICE_VERIFICATION = 'POLICE_VERIFICATION',
  TRAINING_CERTIFICATE = 'TRAINING_CERTIFICATE',
  OTHER = 'OTHER',
}

export enum TransportRequestTypeEnum {
  NEW_ALLOCATION = 'NEW_ALLOCATION',
  ROUTE_CHANGE = 'ROUTE_CHANGE',
  STOP_CHANGE = 'STOP_CHANGE',
  TEMPORARY_REQUEST = 'TEMPORARY_REQUEST',
  CANCELLATION = 'CANCELLATION',
}

export enum TransportRequestStatusEnum {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MaintenanceCategoryEnum {
  ENGINE = 'ENGINE',
  ELECTRICAL = 'ELECTRICAL',
  TYRES = 'TYRES',
  BRAKES = 'BRAKES',
  BODY_WORK = 'BODY_WORK',
  AC_COOLING = 'AC_COOLING',
  SERVICE_ROUTINE = 'SERVICE_ROUTINE',
  OTHER = 'OTHER',
}

export enum MaintenancePriorityEnum {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  NORMAL = 'NORMAL',
  LOW = 'LOW',
}

export enum MaintenanceStatusEnum {
  REPORTED = 'REPORTED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TripTypeEnum {
  PICKUP = 'PICKUP',
  DROP = 'DROP',
  SPECIAL_TRIP = 'SPECIAL_TRIP',
  OTHER = 'OTHER',
}

export enum TripStatusEnum {
  SCHEDULED = 'SCHEDULED',
  IN_TRANSIT = 'IN_TRANSIT',
  COMPLETED = 'COMPLETED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',
}

// ── 1. Vehicle DTOs ─────────────────────────────────────────────────────────

export class CreateVehicleDto {
  @ApiPropertyOptional({ example: 'BUS-01' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiProperty({ example: 'GJ-01-AB-1234' })
  @IsNotEmpty()
  @IsString()
  registrationNumber: string;

  @ApiPropertyOptional({ enum: VehicleTypeEnum, default: VehicleTypeEnum.BUS })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiProperty({ example: 'Tata Starbus 40 Seater' })
  @IsNotEmpty()
  @IsString()
  makeModel: string;

  @ApiPropertyOptional({ example: 'Tata Motors' })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({ example: 'Starbus Ultra' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ example: 40 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional({ enum: FuelTypeEnum, default: FuelTypeEnum.DIESEL })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 'UNIVERSITY' })
  @IsOptional()
  @IsString()
  ownerType?: string;

  @ApiPropertyOptional({ example: 'MAT400011K12345' })
  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @ApiPropertyOptional({ example: 'ENG9876543' })
  @IsOptional()
  @IsString()
  engineNumber?: string;

  @ApiPropertyOptional({ example: 'RC-GJ01-2024-001' })
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  purchaseDate?: string;

  @ApiPropertyOptional({ example: 'POL-ICICI-2026-9999' })
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsString()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ example: 'FIT-RTO-2026-4444' })
  @IsOptional()
  @IsString()
  fitnessCertificateNumber?: string;

  @ApiPropertyOptional({ example: '2027-01-15' })
  @IsOptional()
  @IsString()
  fitnessExpiry?: string;

  @ApiPropertyOptional({ example: 'PERMIT-GUJ-8888' })
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiPropertyOptional({ example: '2028-06-30' })
  @IsOptional()
  @IsString()
  permitExpiry?: string;

  @ApiPropertyOptional({ example: 'PUC-2026-5555' })
  @IsOptional()
  @IsString()
  pollutionCertificateNumber?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsString()
  pucExpiry?: string;

  @ApiPropertyOptional({ enum: VehicleStatusEnum, default: VehicleStatusEnum.ACTIVE })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Standard GPS & Speed Governor installed' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateVehicleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ enum: VehicleTypeEnum })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  makeModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  capacity?: number;

  @ApiPropertyOptional({ enum: FuelTypeEnum })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  engineNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  insuranceExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fitnessCertificateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fitnessExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permitNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permitExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pollutionCertificateNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pucExpiry?: string;

  @ApiPropertyOptional({ enum: VehicleStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VehicleQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: VehicleTypeEnum })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ enum: VehicleStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ enum: FuelTypeEnum })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 'GJ-01' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateVehicleDocumentDto {
  @ApiProperty({ enum: VehicleDocumentTypeEnum, example: VehicleDocumentTypeEnum.INSURANCE })
  @IsNotEmpty()
  @IsString()
  docType: string;

  @ApiProperty({ example: 'POL-ICICI-2026-9999' })
  @IsNotEmpty()
  @IsString()
  docNumber: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2027-08-31' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiProperty({ example: 'https://cdn.ssiu.edu.in/transport/insurance_2026.pdf' })
  @IsNotEmpty()
  @IsString()
  docUrl: string;

  @ApiPropertyOptional({ example: 'Annual comprehensive fleet policy' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 2. Driver DTOs ──────────────────────────────────────────────────────────

export class CreateDriverDto {
  @ApiPropertyOptional({ example: 'DRV-001' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ example: 'Rameshwar Yadav' })
  @IsNotEmpty()
  @IsString()
  driverName: string;

  @ApiProperty({ example: '9825123456' })
  @IsNotEmpty()
  @IsString()
  contactNumber: string;

  @ApiPropertyOptional({ example: 'rameshwar.driver@ssiu.edu.in' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '1982-05-12' })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({ example: 'GJ01-20150045678' })
  @IsNotEmpty()
  @IsString()
  licenseNumber: string;

  @ApiPropertyOptional({ example: 'HEAVY_VEHICLE' })
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional({ example: '2015-06-10' })
  @IsOptional()
  @IsString()
  licenseIssueDate?: string;

  @ApiPropertyOptional({ example: '2029-05-15' })
  @IsOptional()
  @IsString()
  licenseExpiry?: string;

  @ApiPropertyOptional({ example: 8.5 })
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @ApiPropertyOptional({ example: 'Plot 42, Sector 21, Gandhinagar' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '9825199999 (Son: Anil Yadav)' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/transport/driver_rameshwar.jpg' })
  @IsOptional()
  @IsString()
  driverPhotoUrl?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/transport/dl_rameshwar.pdf' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ enum: DriverStatusEnum, default: DriverStatusEnum.ACTIVE })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateDriverDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseIssueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  licenseExpiry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  experienceYears?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  driverPhotoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ enum: DriverStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;
}

export class DriverQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: DriverStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Rameshwar' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class CreateDriverDocumentDto {
  @ApiProperty({ enum: DriverDocumentTypeEnum, example: DriverDocumentTypeEnum.DRIVING_LICENSE })
  @IsNotEmpty()
  @IsString()
  docType: string;

  @ApiProperty({ example: 'DL-GJ01-2015-8888' })
  @IsNotEmpty()
  @IsString()
  docNumber: string;

  @ApiPropertyOptional({ example: '2015-06-10' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2029-05-15' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://cdn.ssiu.edu.in/transport/driver_dl_scan.pdf' })
  @IsOptional()
  @IsString()
  docUrl?: string;

  @ApiPropertyOptional({ example: 'Heavy commercial transport badge endorsed' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 3. Vehicle-Driver Mapping DTOs ──────────────────────────────────────────

export class AssignDriverToVehicleDto {
  @ApiProperty({ example: 'vehicle-uuid-01' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'driver-uuid-01' })
  @IsNotEmpty()
  @IsString()
  driverId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: '2026-08-16' })
  @IsOptional()
  @IsString()
  assignedDate?: string;

  @ApiPropertyOptional({ example: 'Regular route driver assignment' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 4. Route & Stops DTOs ───────────────────────────────────────────────────

export class CreateRouteStopDto {
  @ApiProperty({ example: 'ISKCON Cross Roads' })
  @IsNotEmpty()
  @IsString()
  stopName: string;

  @ApiPropertyOptional({ example: 'STP-101' })
  @IsOptional()
  @IsString()
  stopCode?: string;

  @ApiPropertyOptional({ example: 'SG Highway, Ahmedabad' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiProperty({ example: '07:15 AM' })
  @IsNotEmpty()
  @IsString()
  pickupTime: string;

  @ApiProperty({ example: '05:45 PM' })
  @IsNotEmpty()
  @IsString()
  dropTime: string;

  @ApiPropertyOptional({ example: 23.0298 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 72.5074 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateRouteDto {
  @ApiProperty({ example: 'R-101' })
  @IsNotEmpty()
  @IsString()
  routeNumber: string;

  @ApiPropertyOptional({ example: 'R-101' })
  @IsOptional()
  @IsString()
  routeCode?: string;

  @ApiProperty({ example: 'Ahmedabad ISKCON — Gandhinagar Campus' })
  @IsNotEmpty()
  @IsString()
  routeName: string;

  @ApiProperty({ example: 'ISKCON Cross Roads' })
  @IsNotEmpty()
  @IsString()
  startPoint: string;

  @ApiProperty({ example: 'SSIU Main Campus, Gandhinagar' })
  @IsNotEmpty()
  @IsString()
  endPoint: string;

  @ApiPropertyOptional({ example: 28.5 })
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  estDurationMins?: number;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @ApiPropertyOptional({ type: [CreateRouteStopDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteStopDto)
  stops?: CreateRouteStopDto[];
}

export class UpdateRouteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routeNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routeCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  routeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startPoint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endPoint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  estDurationMins?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  monthlyFee?: number;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;
}

export class RouteQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'ISKCON' })
  @IsOptional()
  @IsString()
  search?: string;
}

// ── 5. Vehicle-Route Mapping DTOs ───────────────────────────────────────────

export class AssignVehicleToRouteDto {
  @ApiProperty({ example: 'vehicle-uuid-01' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'route-uuid-01' })
  @IsNotEmpty()
  @IsString()
  routeId: string;

  @ApiPropertyOptional({ example: 'REGULAR' })
  @IsOptional()
  @IsString()
  shiftType?: string;

  @ApiPropertyOptional({ example: 'Morning & Evening shift transport run' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 6. Student Transport Allocation DTOs ────────────────────────────────────

export class AllocateStudentTransportDto {
  @ApiProperty({ example: 'student-uuid-01' })
  @IsNotEmpty()
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'route-uuid-01' })
  @IsNotEmpty()
  @IsString()
  routeId: string;

  @ApiProperty({ example: 'stop-uuid-01' })
  @IsNotEmpty()
  @IsString()
  stopId: string;

  @ApiProperty({ example: 'vehicle-uuid-01' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ example: 'Academic year seat allocation' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class VacateStudentTransportDto {
  @ApiPropertyOptional({ example: 'Semester ended / Route change' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 7. Transport Requests DTOs ──────────────────────────────────────────────

export class CreateTransportRequestDto {
  @ApiProperty({ example: 'route-uuid-01' })
  @IsNotEmpty()
  @IsString()
  routeId: string;

  @ApiProperty({ example: 'stop-uuid-01' })
  @IsNotEmpty()
  @IsString()
  stopId: string;

  @ApiPropertyOptional({ enum: TransportRequestTypeEnum, default: TransportRequestTypeEnum.NEW_ALLOCATION })
  @IsOptional()
  @IsString()
  requestType?: string;

  @ApiPropertyOptional({ example: '2026-27' })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({ example: 'Requesting pickup from ISKCON Circle stop' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateTransportRequestStatusDto {
  @ApiProperty({ enum: TransportRequestStatusEnum })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'vehicle-uuid-01' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ example: 'Approved and allocated to Bus 01' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

// ── 8. Vehicle Maintenance DTOs ─────────────────────────────────────────────

export class CreateVehicleMaintenanceDto {
  @ApiProperty({ example: 'vehicle-uuid-01' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'Brake pad replacement and brake oil refill' })
  @IsNotEmpty()
  @IsString()
  issue: string;

  @ApiPropertyOptional({ enum: MaintenanceCategoryEnum, default: MaintenanceCategoryEnum.BRAKES })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Front right brake screeching during deceleration' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MaintenancePriorityEnum, default: MaintenancePriorityEnum.NORMAL })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ example: 'Vikrambhai Vaghela (Chief Mechanic)' })
  @IsOptional()
  @IsString()
  assignedStaff?: string;

  @ApiPropertyOptional({ example: 4500.0 })
  @IsOptional()
  @IsNumber()
  estimatedCost?: number;

  @ApiPropertyOptional({ example: 'NS/TRANSPORT/2026/0014' })
  @IsOptional()
  @IsString()
  notesheetId?: string;
}

export class UpdateVehicleMaintenanceDto {
  @ApiPropertyOptional({ enum: MaintenanceStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedStaff?: string;

  @ApiPropertyOptional({ example: 4800.0 })
  @IsOptional()
  @IsNumber()
  actualCost?: number;

  @ApiPropertyOptional({ example: 'Completed brake pad replacement and tested' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2026-08-18' })
  @IsOptional()
  @IsString()
  completedDate?: string;
}

// ── 9. Trip Schedule DTOs ───────────────────────────────────────────────────

export class CreateTripScheduleDto {
  @ApiProperty({ example: 'vehicle-uuid-01' })
  @IsNotEmpty()
  @IsString()
  vehicleId: string;

  @ApiProperty({ example: 'route-uuid-01' })
  @IsNotEmpty()
  @IsString()
  routeId: string;

  @ApiPropertyOptional({ example: 'driver-uuid-01' })
  @IsOptional()
  @IsString()
  driverId?: string;

  @ApiProperty({ example: '2026-08-18' })
  @IsNotEmpty()
  @IsString()
  tripDate: string;

  @ApiPropertyOptional({ example: 'MORNING' })
  @IsOptional()
  @IsString()
  shift?: string;

  @ApiProperty({ example: '07:00 AM' })
  @IsNotEmpty()
  @IsString()
  startTime: string;

  @ApiPropertyOptional({ example: '08:30 AM' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ enum: TripTypeEnum, default: TripTypeEnum.PICKUP })
  @IsOptional()
  @IsString()
  tripType?: string;
}

export class UpdateTripScheduleDto {
  @ApiPropertyOptional({ enum: TripStatusEnum })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '08:35 AM' })
  @IsOptional()
  @IsString()
  endTime?: string;
}

// ── 10. Report Query DTO ────────────────────────────────────────────────────

export class TransportReportQueryDto {
  @ApiPropertyOptional({ example: 'VEHICLE_LIST' })
  @IsOptional()
  @IsString()
  reportType?: string;

  @ApiPropertyOptional({ example: 'ALL' })
  @IsOptional()
  @IsString()
  routeId?: string;

  @ApiPropertyOptional({ example: 'ALL' })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiPropertyOptional({ example: '30' })
  @IsOptional()
  @IsString()
  expiryDays?: string;
}
