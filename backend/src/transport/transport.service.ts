import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleQueryDto,
  CreateVehicleDocumentDto,
  CreateDriverDto,
  UpdateDriverDto,
  DriverQueryDto,
  CreateDriverDocumentDto,
  AssignDriverToVehicleDto,
  CreateRouteDto,
  UpdateRouteDto,
  RouteQueryDto,
  CreateRouteStopDto,
  AssignVehicleToRouteDto,
  AllocateStudentTransportDto,
  VacateStudentTransportDto,
  CreateTransportRequestDto,
  UpdateTransportRequestStatusDto,
  CreateVehicleMaintenanceDto,
  UpdateVehicleMaintenanceDto,
  CreateTripScheduleDto,
  UpdateTripScheduleDto,
  TransportReportQueryDto,
  VehicleStatusEnum,
  DriverStatusEnum,
} from './dto/transport.dto';

@Injectable()
export class TransportService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(prefix: string) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${timestamp}${random}`;
  }

  // ── 1. Vehicle Management ─────────────────────────────────────────────────

  async createVehicle(dto: CreateVehicleDto) {
    const regNo = dto.registrationNumber.trim().toUpperCase();
    const existing = await this.prisma.vehicle.findUnique({
      where: { registrationNumber: regNo },
    });
    if (existing) {
      throw new ConflictException(`Vehicle with registration number '${regNo}' already exists.`);
    }

    return this.prisma.vehicle.create({
      data: {
        vehicleNumber: dto.vehicleNumber || regNo,
        registrationNumber: regNo,
        vehicleType: dto.vehicleType || 'BUS',
        makeModel: dto.makeModel,
        manufacturer: dto.manufacturer,
        model: dto.model,
        year: dto.year,
        capacity: dto.capacity || 40,
        fuelType: dto.fuelType || 'DIESEL',
        ownerType: dto.ownerType || 'UNIVERSITY',
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        rcNumber: dto.rcNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        insuranceNumber: dto.insuranceNumber,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
        fitnessCertificateNumber: dto.fitnessCertificateNumber,
        fitnessExpiry: dto.fitnessExpiry ? new Date(dto.fitnessExpiry) : undefined,
        permitNumber: dto.permitNumber,
        permitExpiry: dto.permitExpiry ? new Date(dto.permitExpiry) : undefined,
        pollutionCertificateNumber: dto.pollutionCertificateNumber,
        pucExpiry: dto.pucExpiry ? new Date(dto.pucExpiry) : undefined,
        status: dto.status || VehicleStatusEnum.ACTIVE,
        remarks: dto.remarks,
      },
    });
  }

  async getVehicles(query?: VehicleQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.vehicleType && query.vehicleType !== 'ALL') where.vehicleType = query.vehicleType.toUpperCase();
    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();
    if (query?.fuelType && query.fuelType !== 'ALL') where.fuelType = query.fuelType.toUpperCase();

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { registrationNumber: { contains: q, mode: 'insensitive' } },
        { vehicleNumber: { contains: q, mode: 'insensitive' } },
        { makeModel: { contains: q, mode: 'insensitive' } },
        { manufacturer: { contains: q, mode: 'insensitive' } },
        { rcNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        include: {
          documents: true,
          driverMappings: {
            where: { status: 'ACTIVE' },
            include: { driver: true },
          },
          routeMappings: {
            where: { status: 'ACTIVE' },
            include: { route: true },
          },
          allotments: {
            where: { status: 'ACTIVE' },
          },
          _count: { select: { allotments: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getVehicleById(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        documents: true,
        driverMappings: {
          include: { driver: true },
          orderBy: { createdAt: 'desc' },
        },
        routeMappings: {
          include: { route: true },
          orderBy: { createdAt: 'desc' },
        },
        allotments: {
          where: { status: 'ACTIVE' },
          include: { student: true, stop: true, route: true },
          take: 100,
        },
        maintenances: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found.');
    return vehicle;
  }

  async updateVehicle(id: string, dto: UpdateVehicleDto) {
    await this.getVehicleById(id);

    const updateData: any = {};
    if (dto.vehicleNumber !== undefined) updateData.vehicleNumber = dto.vehicleNumber;
    if (dto.registrationNumber !== undefined) updateData.registrationNumber = dto.registrationNumber.toUpperCase();
    if (dto.vehicleType !== undefined) updateData.vehicleType = dto.vehicleType.toUpperCase();
    if (dto.makeModel !== undefined) updateData.makeModel = dto.makeModel;
    if (dto.manufacturer !== undefined) updateData.manufacturer = dto.manufacturer;
    if (dto.model !== undefined) updateData.model = dto.model;
    if (dto.year !== undefined) updateData.year = dto.year;
    if (dto.capacity !== undefined) updateData.capacity = dto.capacity;
    if (dto.fuelType !== undefined) updateData.fuelType = dto.fuelType.toUpperCase();
    if (dto.ownerType !== undefined) updateData.ownerType = dto.ownerType.toUpperCase();
    if (dto.chassisNumber !== undefined) updateData.chassisNumber = dto.chassisNumber;
    if (dto.engineNumber !== undefined) updateData.engineNumber = dto.engineNumber;
    if (dto.rcNumber !== undefined) updateData.rcNumber = dto.rcNumber;
    if (dto.insuranceNumber !== undefined) updateData.insuranceNumber = dto.insuranceNumber;
    if (dto.insuranceExpiry) updateData.insuranceExpiry = new Date(dto.insuranceExpiry);
    if (dto.fitnessCertificateNumber !== undefined) updateData.fitnessCertificateNumber = dto.fitnessCertificateNumber;
    if (dto.fitnessExpiry) updateData.fitnessExpiry = new Date(dto.fitnessExpiry);
    if (dto.pollutionCertificateNumber !== undefined) updateData.pollutionCertificateNumber = dto.pollutionCertificateNumber;
    if (dto.pucExpiry) updateData.pucExpiry = new Date(dto.pucExpiry);
    if (dto.permitNumber !== undefined) updateData.permitNumber = dto.permitNumber;
    if (dto.permitExpiry) updateData.permitExpiry = new Date(dto.permitExpiry);
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();
    if (dto.remarks !== undefined) updateData.remarks = dto.remarks;

    return this.prisma.vehicle.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteVehicle(id: string) {
    await this.getVehicleById(id);
    return this.prisma.vehicle.delete({ where: { id } });
  }

  // ── Vehicle Document Management ───────────────────────────────────────────

  async uploadVehicleDocument(vehicleId: string, dto: CreateVehicleDocumentDto, uploadedBy?: string) {
    await this.getVehicleById(vehicleId);

    const expiry = dto.expiryDate ? new Date(dto.expiryDate) : null;
    let status = 'VALID';
    if (expiry) {
      const now = new Date();
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        status = 'EXPIRED';
      } else if (diffDays <= 30) {
        status = 'EXPIRING_SOON';
      }
    }

    return this.prisma.vehicleDocument.create({
      data: {
        vehicleId,
        docType: dto.docType.toUpperCase(),
        docNumber: dto.docNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: expiry || undefined,
        docUrl: dto.docUrl,
        uploadedBy: uploadedBy || 'Transport Officer',
        status,
        remarks: dto.remarks,
      },
    });
  }

  async getVehicleDocuments(vehicleId: string) {
    await this.getVehicleById(vehicleId);
    return this.prisma.vehicleDocument.findMany({
      where: { vehicleId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async deleteVehicleDocument(documentId: string) {
    const doc = await this.prisma.vehicleDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Vehicle document not found.');
    return this.prisma.vehicleDocument.delete({ where: { id: documentId } });
  }

  // ── 2. Driver Management ──────────────────────────────────────────────────

  async createDriver(dto: CreateDriverDto) {
    const licNo = dto.licenseNumber.trim().toUpperCase();
    const existingLic = await this.prisma.driverProfile.findUnique({
      where: { licenseNumber: licNo },
    });
    if (existingLic) {
      throw new ConflictException(`Driver with license number '${licNo}' already exists.`);
    }

    if (dto.driverId) {
      const existingId = await this.prisma.driverProfile.findUnique({
        where: { driverId: dto.driverId.toUpperCase() },
      });
      if (existingId) {
        throw new ConflictException(`Driver ID '${dto.driverId}' is already assigned.`);
      }
    }

    return this.prisma.driverProfile.create({
      data: {
        driverId: dto.driverId || this.generateNumber('DRV'),
        driverName: dto.driverName,
        contactNumber: dto.contactNumber,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        licenseNumber: licNo,
        licenseType: dto.licenseType || 'HEAVY_VEHICLE',
        licenseIssueDate: dto.licenseIssueDate ? new Date(dto.licenseIssueDate) : undefined,
        licenseExpiry: dto.licenseExpiry ? new Date(dto.licenseExpiry) : undefined,
        experienceYears: dto.experienceYears ?? 5,
        address: dto.address,
        emergencyContact: dto.emergencyContact,
        driverPhotoUrl: dto.driverPhotoUrl,
        documentUrl: dto.documentUrl,
        status: dto.status || DriverStatusEnum.ACTIVE,
      },
    });
  }

  async getDrivers(query?: DriverQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { driverName: { contains: q, mode: 'insensitive' } },
        { driverId: { contains: q, mode: 'insensitive' } },
        { licenseNumber: { contains: q, mode: 'insensitive' } },
        { contactNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.driverProfile.count({ where }),
      this.prisma.driverProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          documents: true,
          vehicleMappings: {
            where: { status: 'ACTIVE' },
            include: { vehicle: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getDriverById(id: string) {
    const driver = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: {
        documents: true,
        vehicleMappings: {
          include: { vehicle: true },
          orderBy: { createdAt: 'desc' },
        },
        trips: {
          include: { route: true, vehicle: true },
          orderBy: { tripDate: 'desc' },
          take: 50,
        },
        incidents: true,
      },
    });
    if (!driver) throw new NotFoundException('Driver profile not found.');
    return driver;
  }

  async updateDriver(id: string, dto: UpdateDriverDto) {
    await this.getDriverById(id);

    const updateData: any = {};
    if (dto.driverId !== undefined) updateData.driverId = dto.driverId.toUpperCase();
    if (dto.driverName !== undefined) updateData.driverName = dto.driverName;
    if (dto.contactNumber !== undefined) updateData.contactNumber = dto.contactNumber;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.dateOfBirth) updateData.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.licenseNumber !== undefined) updateData.licenseNumber = dto.licenseNumber.toUpperCase();
    if (dto.licenseType !== undefined) updateData.licenseType = dto.licenseType;
    if (dto.licenseIssueDate) updateData.licenseIssueDate = new Date(dto.licenseIssueDate);
    if (dto.licenseExpiry) updateData.licenseExpiry = new Date(dto.licenseExpiry);
    if (dto.experienceYears !== undefined) updateData.experienceYears = dto.experienceYears;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact;
    if (dto.driverPhotoUrl !== undefined) updateData.driverPhotoUrl = dto.driverPhotoUrl;
    if (dto.documentUrl !== undefined) updateData.documentUrl = dto.documentUrl;
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();

    return this.prisma.driverProfile.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDriver(id: string) {
    await this.getDriverById(id);
    return this.prisma.driverProfile.delete({ where: { id } });
  }

  // ── Driver Document Management ────────────────────────────────────────────

  async uploadDriverDocument(driverId: string, dto: CreateDriverDocumentDto, uploadedBy?: string) {
    await this.getDriverById(driverId);

    const expiry = dto.expiryDate ? new Date(dto.expiryDate) : null;
    let status = 'VALID';
    if (expiry) {
      const now = new Date();
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) {
        status = 'EXPIRED';
      } else if (diffDays <= 30) {
        status = 'EXPIRING_SOON';
      }
    }

    return this.prisma.driverDocument.create({
      data: {
        driverId,
        docType: dto.docType.toUpperCase(),
        docNumber: dto.docNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        expiryDate: expiry || undefined,
        docUrl: dto.docUrl,
        uploadedBy: uploadedBy || 'Transport Admin',
        status,
        remarks: dto.remarks,
      },
    });
  }

  async getDriverDocuments(driverId: string) {
    await this.getDriverById(driverId);
    return this.prisma.driverDocument.findMany({
      where: { driverId },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async deleteDriverDocument(documentId: string) {
    const doc = await this.prisma.driverDocument.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Driver document not found.');
    return this.prisma.driverDocument.delete({ where: { id: documentId } });
  }

  // ── 3. Vehicle-Driver Assignment ──────────────────────────────────────────

  async assignDriverToVehicle(dto: AssignDriverToVehicleDto) {
    const [vehicle, driver] = await Promise.all([
      this.getVehicleById(dto.vehicleId),
      this.getDriverById(dto.driverId),
    ]);

    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign driver to an inactive vehicle (status: ${vehicle.status}).`);
    }

    if (driver.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign driver who is currently '${driver.status}'.`);
    }

    // License expiry validation
    if (driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date()) {
      throw new BadRequestException(`Cannot assign driver: Driver's mandatory Driving License has EXPIRED.`);
    }

    // Check if driver has any active driving license document that is expired
    const expiredLicenseDoc = await this.prisma.driverDocument.findFirst({
      where: {
        driverId: dto.driverId,
        docType: 'DRIVING_LICENSE',
        status: 'EXPIRED',
      },
    });
    if (expiredLicenseDoc) {
      throw new BadRequestException(`Cannot assign driver: Driver's mandatory Driving License document is EXPIRED.`);
    }

    // Prevent overlapping active assignment for same driver
    const activeDriverMapping = await this.prisma.vehicleDriverMapping.findFirst({
      where: {
        driverId: dto.driverId,
        status: 'ACTIVE',
      },
    });
    if (activeDriverMapping && activeDriverMapping.vehicleId !== dto.vehicleId) {
      throw new BadRequestException(`Driver is already actively assigned to another vehicle.`);
    }

    // Deactivate previous active primary assignments on vehicle if this is primary
    if (dto.isPrimary !== false) {
      await this.prisma.vehicleDriverMapping.updateMany({
        where: {
          vehicleId: dto.vehicleId,
          status: 'ACTIVE',
          isPrimary: true,
        },
        data: { status: 'REPLACED', unassignedDate: new Date() },
      });
    }

    return this.prisma.vehicleDriverMapping.create({
      data: {
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        isPrimary: dto.isPrimary ?? true,
        assignedDate: dto.assignedDate ? new Date(dto.assignedDate) : new Date(),
        status: 'ACTIVE',
        remarks: dto.remarks,
      },
      include: {
        vehicle: true,
        driver: true,
      },
    });
  }

  async getVehicleDriverHistory(vehicleId: string) {
    await this.getVehicleById(vehicleId);
    return this.prisma.vehicleDriverMapping.findMany({
      where: { vehicleId },
      include: { driver: true },
      orderBy: { assignedDate: 'desc' },
    });
  }

  // ── 4. Routes & Stops Management ──────────────────────────────────────────

  async createRoute(dto: CreateRouteDto) {
    const routeNo = dto.routeNumber.trim().toUpperCase();
    const existing = await this.prisma.transportRoute.findUnique({
      where: { routeNumber: routeNo },
    });
    if (existing) {
      throw new ConflictException(`Route with number/code '${routeNo}' already exists.`);
    }

    // Check stops sequence uniqueness if stops provided
    if (dto.stops && dto.stops.length > 0) {
      const sequences = dto.stops.map((s) => s.sequence || 1);
      const uniqueSeqs = new Set(sequences);
      if (uniqueSeqs.size !== sequences.length) {
        throw new BadRequestException('Duplicate stop sequence numbers detected in route creation.');
      }
    }

    return this.prisma.transportRoute.create({
      data: {
        routeNumber: routeNo,
        routeCode: dto.routeCode || routeNo,
        routeName: dto.routeName,
        startPoint: dto.startPoint,
        endPoint: dto.endPoint,
        distanceKm: dto.distanceKm ?? 25,
        estDurationMins: dto.estDurationMins ?? 45,
        monthlyFee: dto.monthlyFee ?? 2500,
        status: 'ACTIVE',
        stops: dto.stops
          ? {
              create: dto.stops.map((s, idx) => ({
                stopName: s.stopName,
                stopCode: s.stopCode || `STP-${idx + 1}`,
                location: s.location,
                sequence: s.sequence ?? idx + 1,
                pickupTime: s.pickupTime,
                dropTime: s.dropTime,
                latitude: s.latitude,
                longitude: s.longitude,
                status: 'ACTIVE',
              })),
            }
          : undefined,
      },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
      },
    });
  }

  async getRoutes(query?: RouteQueryDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status && query.status !== 'ALL') where.status = query.status.toUpperCase();

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { routeNumber: { contains: q, mode: 'insensitive' } },
        { routeCode: { contains: q, mode: 'insensitive' } },
        { routeName: { contains: q, mode: 'insensitive' } },
        { startPoint: { contains: q, mode: 'insensitive' } },
        { endPoint: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.transportRoute.count({ where }),
      this.prisma.transportRoute.findMany({
        where,
        skip,
        take: limit,
        include: {
          stops: { orderBy: { sequence: 'asc' } },
          vehicleMappings: {
            where: { status: 'ACTIVE' },
            include: {
              vehicle: {
                include: {
                  driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
                },
              },
            },
          },
          allotments: {
            where: { status: 'ACTIVE' },
          },
          _count: { select: { allotments: true, stops: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async getRouteById(id: string) {
    const route = await this.prisma.transportRoute.findUnique({
      where: { id },
      include: {
        stops: { orderBy: { sequence: 'asc' } },
        vehicleMappings: {
          where: { status: 'ACTIVE' },
          include: {
            vehicle: {
              include: {
                driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
              },
            },
          },
        },
        allotments: {
          where: { status: 'ACTIVE' },
          include: { student: true, stop: true, vehicle: true },
        },
      },
    });
    if (!route) throw new NotFoundException('Route not found.');
    return route;
  }

  async updateRoute(id: string, dto: UpdateRouteDto) {
    await this.getRouteById(id);

    const updateData: any = {};
    if (dto.routeNumber !== undefined) updateData.routeNumber = dto.routeNumber.toUpperCase();
    if (dto.routeCode !== undefined) updateData.routeCode = dto.routeCode.toUpperCase();
    if (dto.routeName !== undefined) updateData.routeName = dto.routeName;
    if (dto.startPoint !== undefined) updateData.startPoint = dto.startPoint;
    if (dto.endPoint !== undefined) updateData.endPoint = dto.endPoint;
    if (dto.distanceKm !== undefined) updateData.distanceKm = dto.distanceKm;
    if (dto.estDurationMins !== undefined) updateData.estDurationMins = dto.estDurationMins;
    if (dto.monthlyFee !== undefined) updateData.monthlyFee = dto.monthlyFee;
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();

    return this.prisma.transportRoute.update({
      where: { id },
      data: updateData,
      include: { stops: { orderBy: { sequence: 'asc' } } },
    });
  }

  async deleteRoute(id: string) {
    await this.getRouteById(id);
    return this.prisma.transportRoute.delete({ where: { id } });
  }

  async addRouteStop(routeId: string, dto: CreateRouteStopDto) {
    await this.getRouteById(routeId);

    const sequence = dto.sequence || 1;
    const existingSeq = await this.prisma.transportStop.findUnique({
      where: { routeId_sequence: { routeId, sequence } },
    });
    if (existingSeq) {
      throw new ConflictException(`Stop with sequence ${sequence} already exists on this route.`);
    }

    return this.prisma.transportStop.create({
      data: {
        routeId,
        stopName: dto.stopName,
        stopCode: dto.stopCode,
        location: dto.location,
        sequence,
        pickupTime: dto.pickupTime,
        dropTime: dto.dropTime,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'ACTIVE',
      },
    });
  }

  async deleteRouteStop(stopId: string) {
    const stop = await this.prisma.transportStop.findUnique({ where: { id: stopId } });
    if (!stop) throw new NotFoundException('Stop not found.');
    return this.prisma.transportStop.delete({ where: { id: stopId } });
  }

  // ── 5. Vehicle-to-Route Assignment ────────────────────────────────────────

  async assignVehicleToRoute(dto: AssignVehicleToRouteDto) {
    const [vehicle, route] = await Promise.all([
      this.getVehicleById(dto.vehicleId),
      this.getRouteById(dto.routeId),
    ]);

    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign vehicle: Vehicle is currently '${vehicle.status}'.`);
    }

    if (route.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot assign to inactive route '${route.routeName}'.`);
    }

    // Check if vehicle is already assigned to this route actively
    const existing = await this.prisma.vehicleRouteMapping.findFirst({
      where: {
        vehicleId: dto.vehicleId,
        routeId: dto.routeId,
        status: 'ACTIVE',
      },
    });
    if (existing) {
      throw new ConflictException('Vehicle is already actively assigned to this route.');
    }

    return this.prisma.vehicleRouteMapping.create({
      data: {
        vehicleId: dto.vehicleId,
        routeId: dto.routeId,
        shiftType: dto.shiftType || 'REGULAR',
        status: 'ACTIVE',
        remarks: dto.remarks,
      },
      include: {
        vehicle: true,
        route: true,
      },
    });
  }

  async getVehicleRouteMappings(routeId?: string, vehicleId?: string) {
    const where: any = { status: 'ACTIVE' };
    if (routeId && routeId !== 'ALL') where.routeId = routeId;
    if (vehicleId && vehicleId !== 'ALL') where.vehicleId = vehicleId;

    return this.prisma.vehicleRouteMapping.findMany({
      where,
      include: {
        vehicle: {
          include: {
            driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
          },
        },
        route: {
          include: { stops: { orderBy: { sequence: 'asc' } } },
        },
      },
    });
  }

  async removeVehicleRouteMapping(id: string) {
    return this.prisma.vehicleRouteMapping.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // ── 6. Student Transport Allocation & Capacity Enforcement ────────────────

  async allocateStudentTransport(dto: AllocateStudentTransportDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student record not found.');

    // 1. Prevent duplicate active transport allocation for the same student
    const existingActive = await this.prisma.transportAllotment.findFirst({
      where: {
        studentId: dto.studentId,
        status: 'ACTIVE',
      },
    });
    if (existingActive) {
      throw new ConflictException(
        `Student '${student.firstName} ${student.lastName}' (${student.enrollmentNo}) already has an ACTIVE transport allotment (${existingActive.allotmentNo}).`
      );
    }

    // 2. Capacity Validation on Vehicle
    const vehicle = await this.getVehicleById(dto.vehicleId);
    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot allocate to inactive vehicle (Status: ${vehicle.status}).`);
    }

    const activeAllocations = await this.prisma.transportAllotment.count({
      where: {
        vehicleId: dto.vehicleId,
        status: 'ACTIVE',
      },
    });

    if (activeAllocations >= vehicle.capacity) {
      throw new BadRequestException(
        `Vehicle capacity is full. Allocated: ${activeAllocations}/${vehicle.capacity}. Cannot allocate more students.`
      );
    }

    const allotmentNo = this.generateNumber('TRN-ALL');
    const passNo = this.generateNumber('TP');

    return this.prisma.$transaction(async (tx) => {
      const allotment = await tx.transportAllotment.create({
        data: {
          allotmentNo,
          studentId: dto.studentId,
          vehicleId: dto.vehicleId,
          routeId: dto.routeId,
          stopId: dto.stopId,
          academicYear: dto.academicYear || '2026-27',
          status: 'ACTIVE',
          remarks: dto.remarks,
        },
        include: {
          student: true,
          vehicle: true,
          route: true,
          stop: true,
        },
      });

      const pass = await tx.transportPass.create({
        data: {
          passNo,
          allotmentId: allotment.id,
          studentId: dto.studentId,
          validFrom: new Date(),
          validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          status: 'ACTIVE',
          verificationCode: `VER-${Date.now().toString().slice(-6)}`,
        },
      });

      return { ...allotment, pass };
    });
  }

  async vacateStudentTransport(allotmentId: string, dto?: VacateStudentTransportDto) {
    const allotment = await this.prisma.transportAllotment.findUnique({
      where: { id: allotmentId },
    });
    if (!allotment) throw new NotFoundException('Transport allotment not found.');

    return this.prisma.$transaction(async (tx) => {
      await tx.transportPass.updateMany({
        where: { allotmentId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      return tx.transportAllotment.update({
        where: { id: allotmentId },
        data: {
          status: 'CANCELLED',
          remarks: dto?.remarks || 'Transport allotment cancelled / vacated',
        },
        include: { student: true, vehicle: true, route: true, stop: true },
      });
    });
  }

  async getAllotments(studentId?: string, routeId?: string, vehicleId?: string) {
    const where: any = { status: 'ACTIVE' };
    if (studentId) where.studentId = studentId;
    if (routeId && routeId !== 'ALL') where.routeId = routeId;
    if (vehicleId && vehicleId !== 'ALL') where.vehicleId = vehicleId;

    return this.prisma.transportAllotment.findMany({
      where,
      include: {
        student: true,
        vehicle: {
          include: {
            driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
          },
        },
        route: true,
        stop: true,
        passes: { where: { status: 'ACTIVE' } },
      },
      orderBy: { allocatedDate: 'desc' },
    });
  }

  // ── 7. Student Scoped View & Transport Requests ───────────────────────────

  async getStudentTransportView(studentId: string) {
    const allotment = await this.prisma.transportAllotment.findFirst({
      where: { studentId, status: 'ACTIVE' },
      include: {
        vehicle: {
          include: {
            driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
          },
        },
        route: {
          include: { stops: { orderBy: { sequence: 'asc' } } },
        },
        stop: true,
        passes: { where: { status: 'ACTIVE' } },
      },
    });

    const requests = await this.prisma.transportApplication.findMany({
      where: { studentId },
      include: { route: true, stop: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      activeAllotment: allotment || null,
      requests,
    };
  }

  async createTransportRequest(studentId: string, dto: CreateTransportRequestDto) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found.');

    const appNo = this.generateNumber('TRN-APP');

    return this.prisma.transportApplication.create({
      data: {
        applicationNo: appNo,
        studentId,
        routeId: dto.routeId,
        stopId: dto.stopId,
        requestType: dto.requestType || 'NEW_ALLOCATION',
        academicYear: dto.academicYear || '2026-27',
        status: 'SUBMITTED',
      },
      include: {
        student: true,
        route: true,
        stop: true,
      },
    });
  }

  async getTransportRequests(userRole: string, studentId?: string, status?: string) {
    const where: any = {};
    if (userRole === 'STUDENT') {
      where.studentId = studentId;
    } else if (studentId) {
      where.studentId = studentId;
    }

    if (status && status !== 'ALL') where.status = status.toUpperCase();

    return this.prisma.transportApplication.findMany({
      where,
      include: {
        student: true,
        route: true,
        stop: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTransportRequestStatus(id: string, dto: UpdateTransportRequestStatusDto, reviewerId?: string) {
    const app = await this.prisma.transportApplication.findUnique({
      where: { id },
      include: { student: true, route: true, stop: true },
    });
    if (!app) throw new NotFoundException('Transport request not found.');

    const updated = await this.prisma.transportApplication.update({
      where: { id },
      data: {
        status: dto.status.toUpperCase(),
        reviewedBy: reviewerId || 'Transport Admin',
        reviewedAt: new Date(),
      },
      include: { student: true, route: true, stop: true },
    });

    // If approved and vehicle provided, auto-allocate
    if (dto.status === 'APPROVED' && dto.vehicleId) {
      await this.allocateStudentTransport({
        studentId: app.studentId,
        routeId: app.routeId,
        stopId: app.stopId,
        vehicleId: dto.vehicleId,
        academicYear: app.academicYear,
        remarks: dto.remarks || `Approved from Request #${app.applicationNo}`,
      });
    }

    return updated;
  }

  // ── 8. Vehicle Maintenance Management ─────────────────────────────────────

  async createMaintenance(dto: CreateVehicleMaintenanceDto) {
    await this.getVehicleById(dto.vehicleId);

    const mntNo = this.generateNumber('MNT-VEH');

    return this.prisma.vehicleMaintenance.create({
      data: {
        maintenanceNo: mntNo,
        vehicleId: dto.vehicleId,
        issue: dto.issue,
        category: dto.category || 'ENGINE',
        description: dto.description,
        priority: dto.priority || 'NORMAL',
        assignedStaff: dto.assignedStaff,
        estimatedCost: dto.estimatedCost,
        notesheetId: dto.notesheetId,
        status: 'REPORTED',
      },
      include: { vehicle: true },
    });
  }

  async getMaintenances(vehicleId?: string, status?: string) {
    const where: any = {};
    if (vehicleId && vehicleId !== 'ALL') where.vehicleId = vehicleId;
    if (status && status !== 'ALL') where.status = status.toUpperCase();

    return this.prisma.vehicleMaintenance.findMany({
      where,
      include: { vehicle: true },
      orderBy: { reportedDate: 'desc' },
    });
  }

  async updateMaintenance(id: string, dto: UpdateVehicleMaintenanceDto) {
    const mnt = await this.prisma.vehicleMaintenance.findUnique({ where: { id } });
    if (!mnt) throw new NotFoundException('Maintenance record not found.');

    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status.toUpperCase();
    if (dto.assignedStaff !== undefined) updateData.assignedStaff = dto.assignedStaff;
    if (dto.actualCost !== undefined) updateData.actualCost = dto.actualCost;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.completedDate) updateData.completedDate = new Date(dto.completedDate);
    if (dto.status === 'COMPLETED' && !dto.completedDate) updateData.completedDate = new Date();

    return this.prisma.vehicleMaintenance.update({
      where: { id },
      data: updateData,
      include: { vehicle: true },
    });
  }

  // ── 9. Driver Duty & Trip Scheduling ──────────────────────────────────────

  async createTrip(dto: CreateTripScheduleDto) {
    const [vehicle, route] = await Promise.all([
      this.getVehicleById(dto.vehicleId),
      this.getRouteById(dto.routeId),
    ]);

    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(`Cannot schedule trip: Vehicle is '${vehicle.status}'.`);
    }

    if (dto.driverId) {
      const driver = await this.getDriverById(dto.driverId);
      if (driver.status !== 'ACTIVE') {
        throw new BadRequestException(`Cannot schedule trip: Driver is '${driver.status}'.`);
      }
    }

    const tripNo = this.generateNumber('TRP');

    return this.prisma.transportTrip.create({
      data: {
        tripNo,
        vehicleId: dto.vehicleId,
        routeId: dto.routeId,
        driverId: dto.driverId,
        tripDate: new Date(dto.tripDate),
        shift: dto.shift || 'MORNING',
        startTime: dto.startTime,
        endTime: dto.endTime,
        tripType: dto.tripType || 'PICKUP',
        status: 'SCHEDULED',
      },
      include: {
        vehicle: true,
        route: true,
        driver: true,
      },
    });
  }

  async getTrips(date?: string, routeId?: string, vehicleId?: string, driverId?: string) {
    const where: any = {};
    if (date) where.tripDate = new Date(date);
    if (routeId && routeId !== 'ALL') where.routeId = routeId;
    if (vehicleId && vehicleId !== 'ALL') where.vehicleId = vehicleId;
    if (driverId && driverId !== 'ALL') where.driverId = driverId;

    return this.prisma.transportTrip.findMany({
      where,
      include: {
        vehicle: true,
        route: { include: { stops: { orderBy: { sequence: 'asc' } } } },
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDriverDutySchedule(driverId: string) {
    const driver = await this.getDriverById(driverId);

    const activeAssignments = await this.prisma.vehicleDriverMapping.findMany({
      where: { driverId, status: 'ACTIVE' },
      include: {
        vehicle: {
          include: {
            routeMappings: { where: { status: 'ACTIVE' }, include: { route: true } },
          },
        },
      },
    });

    const upcomingTrips = await this.prisma.transportTrip.findMany({
      where: { driverId, status: { in: ['SCHEDULED', 'IN_TRANSIT'] } },
      include: {
        vehicle: true,
        route: { include: { stops: { orderBy: { sequence: 'asc' } } } },
      },
      orderBy: { tripDate: 'asc' },
      take: 20,
    });

    return {
      driver,
      activeAssignments,
      upcomingTrips,
    };
  }

  // ── 10. Fleet Expiry & Dashboard Metrics ──────────────────────────────────

  async getFleetExpiryAlerts(filterDays?: number) {
    const now = new Date();
    const targetDays = filterDays || 30;
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + targetDays);

    const [vehicleDocs, driverDocs, vehicles, drivers] = await Promise.all([
      this.prisma.vehicleDocument.findMany({
        include: { vehicle: true },
      }),
      this.prisma.driverDocument.findMany({
        include: { driver: true },
      }),
      this.prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.driverProfile.findMany({
        where: { status: 'ACTIVE' },
      }),
    ]);

    const expiringVehicleDocs = vehicleDocs.filter((d) => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate);
      return exp <= futureDate;
    });

    const expiringDriverDocs = driverDocs.filter((d) => {
      if (!d.expiryDate) return false;
      const exp = new Date(d.expiryDate);
      return exp <= futureDate;
    });

    const expiredDriverProfiles = drivers.filter((d) => d.licenseExpiry && new Date(d.licenseExpiry) < now);
    const expiredVehicleProfiles = vehicles.filter((v) =>
      [v.insuranceExpiry, v.fitnessExpiry, v.pucExpiry, v.permitExpiry].some((e) => e && new Date(e) < now)
    );

    const expiredCount =
      vehicleDocs.filter((d) => d.expiryDate && new Date(d.expiryDate) < now).length +
      driverDocs.filter((d) => d.expiryDate && new Date(d.expiryDate) < now).length +
      expiredDriverProfiles.length +
      expiredVehicleProfiles.length;

    return {
      targetDays,
      totalExpiringSoon: expiringVehicleDocs.length + expiringDriverDocs.length,
      totalExpired: expiredCount,
      expiringVehicleDocs,
      expiringDriverDocs,
    };
  }

  async getTransportDashboardMetrics() {
    const [
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalRoutes,
      activeRoutes,
      totalAllotments,
      pendingRequests,
      expiries,
    ] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { status: 'ACTIVE' } }),
      this.prisma.vehicle.count({ where: { status: 'UNDER_MAINTENANCE' } }),
      this.prisma.driverProfile.count(),
      this.prisma.driverProfile.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transportRoute.count(),
      this.prisma.transportRoute.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transportAllotment.count({ where: { status: 'ACTIVE' } }),
      this.prisma.transportApplication.count({ where: { status: 'SUBMITTED' } }),
      this.getFleetExpiryAlerts(30),
    ]);

    return {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      totalDrivers,
      activeDrivers,
      totalRoutes,
      activeRoutes,
      totalAllotments,
      pendingRequests,
      expiringDocsCount: expiries.totalExpiringSoon,
      expiredDocsCount: expiries.totalExpired,
    };
  }

  // ── 11. 12 Standard Transport Reports ─────────────────────────────────────

  async getTransportReports(reportType: string, query?: TransportReportQueryDto) {
    const type = (reportType || query?.reportType || 'VEHICLE_LIST').toUpperCase();

    switch (type) {
      case 'VEHICLE_LIST':
        return this.prisma.vehicle.findMany({
          include: {
            driverMappings: { where: { status: 'ACTIVE' }, include: { driver: true } },
            routeMappings: { where: { status: 'ACTIVE' }, include: { route: true } },
            _count: { select: { allotments: true } },
          },
          orderBy: { registrationNumber: 'asc' },
        });

      case 'DRIVER_LIST':
        return this.prisma.driverProfile.findMany({
          include: {
            vehicleMappings: { where: { status: 'ACTIVE' }, include: { vehicle: true } },
            documents: true,
          },
          orderBy: { driverName: 'asc' },
        });

      case 'VEHICLE_DOC_EXPIRY': {
        const docs = await this.prisma.vehicleDocument.findMany({
          include: { vehicle: true },
          orderBy: { expiryDate: 'asc' },
        });
        return docs.map((d) => ({
          vehicleNumber: d.vehicle.vehicleNumber || d.vehicle.registrationNumber,
          registrationNumber: d.vehicle.registrationNumber,
          docType: d.docType,
          docNumber: d.docNumber,
          expiryDate: d.expiryDate,
          status: d.status,
          uploadedBy: d.uploadedBy,
        }));
      }

      case 'DRIVER_DOC_EXPIRY': {
        const docs = await this.prisma.driverDocument.findMany({
          include: { driver: true },
          orderBy: { expiryDate: 'asc' },
        });
        return docs.map((d) => ({
          driverId: d.driver.driverId,
          driverName: d.driver.driverName,
          licenseNumber: d.driver.licenseNumber,
          docType: d.docType,
          docNumber: d.docNumber,
          expiryDate: d.expiryDate,
          status: d.status,
        }));
      }

      case 'ROUTE_LIST':
        return this.prisma.transportRoute.findMany({
          include: {
            stops: { orderBy: { sequence: 'asc' } },
            _count: { select: { allotments: true } },
          },
          orderBy: { routeNumber: 'asc' },
        });

      case 'ROUTE_STOPS':
        return this.prisma.transportStop.findMany({
          include: { route: true },
          orderBy: [{ routeId: 'asc' }, { sequence: 'asc' }],
        });

      case 'STUDENT_ALLOCATION':
        return this.prisma.transportAllotment.findMany({
          where: { status: 'ACTIVE' },
          include: {
            student: true,
            vehicle: true,
            route: true,
            stop: true,
          },
          orderBy: { allocatedDate: 'desc' },
        });

      case 'VEHICLE_CAPACITY': {
        const vehicles = await this.prisma.vehicle.findMany({
          where: { status: 'ACTIVE' },
          include: {
            allotments: { where: { status: 'ACTIVE' } },
          },
        });
        return vehicles.map((v) => ({
          vehicleNumber: v.vehicleNumber || v.registrationNumber,
          registrationNumber: v.registrationNumber,
          capacity: v.capacity,
          allocated: v.allotments.length,
          available: Math.max(0, v.capacity - v.allotments.length),
          occupancyPercent: v.capacity > 0 ? ((v.allotments.length / v.capacity) * 100).toFixed(1) + '%' : '0%',
        }));
      }

      case 'DRIVER_ASSIGNMENT':
        return this.prisma.vehicleDriverMapping.findMany({
          where: { status: 'ACTIVE' },
          include: { vehicle: true, driver: true },
          orderBy: { assignedDate: 'desc' },
        });

      case 'MAINTENANCE_REPORT':
        return this.prisma.vehicleMaintenance.findMany({
          include: { vehicle: true },
          orderBy: { reportedDate: 'desc' },
        });

      case 'TRIP_SCHEDULE':
        return this.prisma.transportTrip.findMany({
          include: { vehicle: true, route: true, driver: true },
          orderBy: { tripDate: 'desc' },
        });

      case 'TRANSPORT_REQUEST_REPORT':
        return this.prisma.transportApplication.findMany({
          include: { student: true, route: true, stop: true },
          orderBy: { createdAt: 'desc' },
        });

      default:
        throw new BadRequestException(`Unknown report type: ${reportType}`);
    }
  }
}
