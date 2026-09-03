import { TransportService } from './src/transport/transport.service';
import {
  VehicleTypeEnum,
  VehicleStatusEnum,
  DriverStatusEnum,
  VehicleDocumentTypeEnum,
  DriverDocumentTypeEnum,
  MaintenanceCategoryEnum,
  MaintenancePriorityEnum,
  TripTypeEnum,
} from './src/transport/dto/transport.dto';

// In-Memory Mock Prisma Service for Phase 8 Transport Management
class MockPrismaService {
  public vehicles: any[] = [];
  public vehicleDocuments: any[] = [];
  public driverProfiles: any[] = [];
  public driverDocuments: any[] = [];
  public vehicleDriverMappings: any[] = [];
  public transportRoutes: any[] = [];
  public transportStops: any[] = [];
  public vehicleRouteMappings: any[] = [];
  public transportApplications: any[] = [];
  public transportAllotments: any[] = [];
  public transportPasses: any[] = [];
  public vehicleMaintenances: any[] = [];
  public transportTrips: any[] = [];
  public students: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    this.students = [
      { id: 'stud-01', firstName: 'Aarav', lastName: 'Patel', enrollmentNo: '24SSIU01001', instituteId: 'inst-01', departmentId: 'dept-01' },
      { id: 'stud-02', firstName: 'Priya', lastName: 'Mehta', enrollmentNo: '24SSIU01002', instituteId: 'inst-01', departmentId: 'dept-01' },
      { id: 'stud-03', firstName: 'Rohan', lastName: 'Shah', enrollmentNo: '24SSIU01003', instituteId: 'inst-01', departmentId: 'dept-01' },
    ];
  }

  $transaction(callback: (tx: any) => Promise<any>) {
    return callback(this);
  }

  student = {
    findUnique: async (args: any) => {
      return this.students.find((s) => s.id === args.where.id) || null;
    },
  };

  vehicle = {
    findUnique: async (args: any) => {
      if (args.where.registrationNumber) {
        return this.vehicles.find((v) => v.registrationNumber === args.where.registrationNumber) || null;
      }
      const v = this.vehicles.find((x) => x.id === args.where.id);
      if (!v) return null;
      const documents = this.vehicleDocuments.filter((d) => d.vehicleId === v.id);
      const driverMappings = this.vehicleDriverMappings.filter((m) => m.vehicleId === v.id).map((m) => ({
        ...m,
        driver: this.driverProfiles.find((d) => d.id === m.driverId),
      }));
      const routeMappings = this.vehicleRouteMappings.filter((m) => m.vehicleId === v.id).map((m) => ({
        ...m,
        route: this.transportRoutes.find((r) => r.id === m.routeId),
      }));
      const allotments = this.transportAllotments.filter((a) => a.vehicleId === v.id && a.status === 'ACTIVE');
      const maintenances = this.vehicleMaintenances.filter((m) => m.vehicleId === v.id);
      return { ...v, documents, driverMappings, routeMappings, allotments, maintenances };
    },
    create: async (args: any) => {
      const newV = { id: `veh-${this.vehicles.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.vehicles.push(newV);
      return newV;
    },
    findMany: async (args?: any) => {
      let list = [...this.vehicles];
      if (args?.where?.status) list = list.filter((v) => v.status === args.where.status);
      return list.map((v) => {
        const documents = this.vehicleDocuments.filter((d) => d.vehicleId === v.id);
        const allotments = this.transportAllotments.filter((a) => a.vehicleId === v.id && a.status === 'ACTIVE');
        const driverMappings = this.vehicleDriverMappings.filter((m) => m.vehicleId === v.id && m.status === 'ACTIVE');
        const routeMappings = this.vehicleRouteMappings.filter((m) => m.vehicleId === v.id && m.status === 'ACTIVE');
        return { ...v, documents, allotments, driverMappings, routeMappings, _count: { allotments: allotments.length } };
      });
    },
    update: async (args: any) => {
      const idx = this.vehicles.findIndex((v) => v.id === args.where.id);
      if (idx !== -1) {
        this.vehicles[idx] = { ...this.vehicles[idx], ...args.data, updatedAt: new Date() };
        return this.vehicles[idx];
      }
      return null;
    },
    delete: async (args: any) => {
      const idx = this.vehicles.findIndex((v) => v.id === args.where.id);
      if (idx !== -1) {
        const deleted = this.vehicles.splice(idx, 1)[0];
        return deleted;
      }
      return null;
    },
    count: async (args?: any) => {
      if (args?.where?.status) return this.vehicles.filter((v) => v.status === args.where.status).length;
      return this.vehicles.length;
    },
  };

  vehicleDocument = {
    create: async (args: any) => {
      const newDoc = { id: `vdoc-${this.vehicleDocuments.length + 1}`, ...args.data, uploadedAt: new Date() };
      this.vehicleDocuments.push(newDoc);
      return newDoc;
    },
    findMany: async (args?: any) => {
      let list = [...this.vehicleDocuments];
      if (args?.where?.vehicleId) list = list.filter((d) => d.vehicleId === args.where.vehicleId);
      return list.map((d) => {
        const vehicle = this.vehicles.find((v) => v.id === d.vehicleId);
        return { ...d, vehicle };
      });
    },
    findUnique: async (args: any) => {
      return this.vehicleDocuments.find((d) => d.id === args.where.id) || null;
    },
    delete: async (args: any) => {
      const idx = this.vehicleDocuments.findIndex((d) => d.id === args.where.id);
      if (idx !== -1) return this.vehicleDocuments.splice(idx, 1)[0];
      return null;
    },
  };

  driverProfile = {
    findUnique: async (args: any) => {
      if (args.where.licenseNumber) {
        return this.driverProfiles.find((d) => d.licenseNumber === args.where.licenseNumber) || null;
      }
      if (args.where.driverId) {
        return this.driverProfiles.find((d) => d.driverId === args.where.driverId) || null;
      }
      const driver = this.driverProfiles.find((d) => d.id === args.where.id);
      if (!driver) return null;
      const documents = this.driverDocuments.filter((doc) => doc.driverId === driver.id);
      const vehicleMappings = this.vehicleDriverMappings.filter((m) => m.driverId === driver.id);
      const trips = this.transportTrips.filter((t) => t.driverId === driver.id);
      return { ...driver, documents, vehicleMappings, trips, incidents: [] };
    },
    create: async (args: any) => {
      const newD = { id: `drv-${this.driverProfiles.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.driverProfiles.push(newD);
      return newD;
    },
    findMany: async (args?: any) => {
      let list = [...this.driverProfiles];
      if (args?.where?.status) list = list.filter((d) => d.status === args.where.status);
      return list.map((d) => {
        const documents = this.driverDocuments.filter((doc) => doc.driverId === d.id);
        const vehicleMappings = this.vehicleDriverMappings.filter((m) => m.driverId === d.id && m.status === 'ACTIVE');
        return { ...d, documents, vehicleMappings };
      });
    },
    update: async (args: any) => {
      const idx = this.driverProfiles.findIndex((d) => d.id === args.where.id);
      if (idx !== -1) {
        this.driverProfiles[idx] = { ...this.driverProfiles[idx], ...args.data, updatedAt: new Date() };
        return this.driverProfiles[idx];
      }
      return null;
    },
    delete: async (args: any) => {
      const idx = this.driverProfiles.findIndex((d) => d.id === args.where.id);
      if (idx !== -1) return this.driverProfiles.splice(idx, 1)[0];
      return null;
    },
    count: async (args?: any) => {
      if (args?.where?.status) return this.driverProfiles.filter((d) => d.status === args.where.status).length;
      return this.driverProfiles.length;
    },
  };

  driverDocument = {
    create: async (args: any) => {
      const newDoc = { id: `ddoc-${this.driverDocuments.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.driverDocuments.push(newDoc);
      return newDoc;
    },
    findFirst: async (args: any) => {
      return (
        this.driverDocuments.find((d) => {
          let match = true;
          if (args.where.driverId) match = match && d.driverId === args.where.driverId;
          if (args.where.docType) match = match && d.docType === args.where.docType;
          if (args.where.status) match = match && d.status === args.where.status;
          return match;
        }) || null
      );
    },
    findMany: async (args?: any) => {
      let list = [...this.driverDocuments];
      if (args?.where?.driverId) list = list.filter((d) => d.driverId === args.where.driverId);
      return list.map((d) => {
        const driver = this.driverProfiles.find((p) => p.id === d.driverId);
        return { ...d, driver };
      });
    },
    findUnique: async (args: any) => {
      return this.driverDocuments.find((d) => d.id === args.where.id) || null;
    },
    delete: async (args: any) => {
      const idx = this.driverDocuments.findIndex((d) => d.id === args.where.id);
      if (idx !== -1) return this.driverDocuments.splice(idx, 1)[0];
      return null;
    },
  };

  vehicleDriverMapping = {
    create: async (args: any) => {
      const newM = { id: `vdm-${this.vehicleDriverMappings.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.vehicleDriverMappings.push(newM);
      const vehicle = this.vehicles.find((v) => v.id === newM.vehicleId);
      const driver = this.driverProfiles.find((d) => d.id === newM.driverId);
      return { ...newM, vehicle, driver };
    },
    findFirst: async (args: any) => {
      return (
        this.vehicleDriverMappings.find((m) => {
          let match = true;
          if (args.where.driverId) match = match && m.driverId === args.where.driverId;
          if (args.where.vehicleId) match = match && m.vehicleId === args.where.vehicleId;
          if (args.where.status) match = match && m.status === args.where.status;
          return match;
        }) || null
      );
    },
    findMany: async (args?: any) => {
      let list = [...this.vehicleDriverMappings];
      if (args?.where?.vehicleId) list = list.filter((m) => m.vehicleId === args.where.vehicleId);
      if (args?.where?.driverId) list = list.filter((m) => m.driverId === args.where.driverId);
      if (args?.where?.status) list = list.filter((m) => m.status === args.where.status);
      return list.map((m) => {
        const vehicle = this.vehicles.find((v) => v.id === m.vehicleId);
        const driver = this.driverProfiles.find((d) => d.id === m.driverId);
        return { ...m, vehicle, driver };
      });
    },
    updateMany: async (args: any) => {
      let count = 0;
      this.vehicleDriverMappings.forEach((m) => {
        if (m.vehicleId === args.where.vehicleId && m.status === args.where.status) {
          Object.assign(m, args.data);
          count++;
        }
      });
      return { count };
    },
  };

  transportRoute = {
    findUnique: async (args: any) => {
      if (args.where.routeNumber) {
        return this.transportRoutes.find((r) => r.routeNumber === args.where.routeNumber) || null;
      }
      const r = this.transportRoutes.find((x) => x.id === args.where.id);
      if (!r) return null;
      const stops = this.transportStops.filter((s) => s.routeId === r.id);
      const vehicleMappings = this.vehicleRouteMappings.filter((m) => m.routeId === r.id);
      const allotments = this.transportAllotments.filter((a) => a.routeId === r.id && a.status === 'ACTIVE');
      return { ...r, stops, vehicleMappings, allotments };
    },
    create: async (args: any) => {
      const { stops, ...rest } = args.data;
      const newR = { id: `route-${this.transportRoutes.length + 1}`, ...rest, createdAt: new Date(), updatedAt: new Date() };
      this.transportRoutes.push(newR);

      if (stops?.create) {
        stops.create.forEach((s: any, idx: number) => {
          this.transportStops.push({
            id: `stop-${this.transportStops.length + 1}`,
            routeId: newR.id,
            sequence: s.sequence || idx + 1,
            ...s,
            createdAt: new Date(),
          });
        });
      }

      const createdStops = this.transportStops.filter((s) => s.routeId === newR.id);
      return { ...newR, stops: createdStops };
    },
    findMany: async (args?: any) => {
      let list = [...this.transportRoutes];
      if (args?.where?.status) list = list.filter((r) => r.status === args.where.status);
      return list.map((r) => {
        const stops = this.transportStops.filter((s) => s.routeId === r.id);
        const allotments = this.transportAllotments.filter((a) => a.routeId === r.id && a.status === 'ACTIVE');
        const vehicleMappings = this.vehicleRouteMappings.filter((m) => m.routeId === r.id && m.status === 'ACTIVE');
        return { ...r, stops, allotments, vehicleMappings, _count: { allotments: allotments.length, stops: stops.length } };
      });
    },
    update: async (args: any) => {
      const idx = this.transportRoutes.findIndex((r) => r.id === args.where.id);
      if (idx !== -1) {
        this.transportRoutes[idx] = { ...this.transportRoutes[idx], ...args.data, updatedAt: new Date() };
        const stops = this.transportStops.filter((s) => s.routeId === args.where.id);
        return { ...this.transportRoutes[idx], stops };
      }
      return null;
    },
    delete: async (args: any) => {
      const idx = this.transportRoutes.findIndex((r) => r.id === args.where.id);
      if (idx !== -1) return this.transportRoutes.splice(idx, 1)[0];
      return null;
    },
    count: async (args?: any) => {
      if (args?.where?.status) return this.transportRoutes.filter((r) => r.status === args.where.status).length;
      return this.transportRoutes.length;
    },
  };

  transportStop = {
    findUnique: async (args: any) => {
      if (args.where.routeId_sequence) {
        return (
          this.transportStops.find(
            (s) => s.routeId === args.where.routeId_sequence.routeId && s.sequence === args.where.routeId_sequence.sequence
          ) || null
        );
      }
      return this.transportStops.find((s) => s.id === args.where.id) || null;
    },
    create: async (args: any) => {
      const newS = { id: `stop-${this.transportStops.length + 1}`, ...args.data, createdAt: new Date() };
      this.transportStops.push(newS);
      return newS;
    },
    findMany: async (args?: any) => {
      return this.transportStops.map((s) => {
        const route = this.transportRoutes.find((r) => r.id === s.routeId);
        return { ...s, route };
      });
    },
    delete: async (args: any) => {
      const idx = this.transportStops.findIndex((s) => s.id === args.where.id);
      if (idx !== -1) return this.transportStops.splice(idx, 1)[0];
      return null;
    },
  };

  vehicleRouteMapping = {
    create: async (args: any) => {
      const newM = { id: `vrm-${this.vehicleRouteMappings.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.vehicleRouteMappings.push(newM);
      const vehicle = this.vehicles.find((v) => v.id === newM.vehicleId);
      const route = this.transportRoutes.find((r) => r.id === newM.routeId);
      return { ...newM, vehicle, route };
    },
    findFirst: async (args: any) => {
      return (
        this.vehicleRouteMappings.find((m) => {
          let match = true;
          if (args.where.vehicleId) match = match && m.vehicleId === args.where.vehicleId;
          if (args.where.routeId) match = match && m.routeId === args.where.routeId;
          if (args.where.status) match = match && m.status === args.where.status;
          return match;
        }) || null
      );
    },
    findMany: async (args?: any) => {
      let list = [...this.vehicleRouteMappings];
      if (args?.where?.routeId) list = list.filter((m) => m.routeId === args.where.routeId);
      if (args?.where?.vehicleId) list = list.filter((m) => m.vehicleId === args.where.vehicleId);
      if (args?.where?.status) list = list.filter((m) => m.status === args.where.status);
      return list.map((m) => {
        const vehicle = this.vehicles.find((v) => v.id === m.vehicleId);
        const route = this.transportRoutes.find((r) => r.id === m.routeId);
        return { ...m, vehicle, route };
      });
    },
    update: async (args: any) => {
      const idx = this.vehicleRouteMappings.findIndex((m) => m.id === args.where.id);
      if (idx !== -1) {
        this.vehicleRouteMappings[idx] = { ...this.vehicleRouteMappings[idx], ...args.data };
        return this.vehicleRouteMappings[idx];
      }
      return null;
    },
  };

  transportAllotment = {
    findFirst: async (args: any) => {
      return (
        this.transportAllotments.find((a) => {
          let match = true;
          if (args.where.studentId) match = match && a.studentId === args.where.studentId;
          if (args.where.status) match = match && a.status === args.where.status;
          return match;
        }) || null
      );
    },
    findUnique: async (args: any) => {
      return this.transportAllotments.find((a) => a.id === args.where.id) || null;
    },
    create: async (args: any) => {
      const newA = { id: `allot-${this.transportAllotments.length + 1}`, ...args.data, allocatedDate: new Date(), createdAt: new Date() };
      this.transportAllotments.push(newA);
      const student = this.students.find((s) => s.id === newA.studentId);
      const vehicle = this.vehicles.find((v) => v.id === newA.vehicleId);
      const route = this.transportRoutes.find((r) => r.id === newA.routeId);
      const stop = this.transportStops.find((s) => s.id === newA.stopId);
      return { ...newA, student, vehicle, route, stop };
    },
    findMany: async (args?: any) => {
      let list = [...this.transportAllotments];
      if (args?.where?.studentId) list = list.filter((a) => a.studentId === args.where.studentId);
      if (args?.where?.routeId) list = list.filter((a) => a.routeId === args.where.routeId);
      if (args?.where?.vehicleId) list = list.filter((a) => a.vehicleId === args.where.vehicleId);
      if (args?.where?.status) list = list.filter((a) => a.status === args.where.status);
      return list.map((a) => {
        const student = this.students.find((s) => s.id === a.studentId);
        const vehicle = this.vehicles.find((v) => v.id === a.vehicleId);
        const route = this.transportRoutes.find((r) => r.id === a.routeId);
        const stop = this.transportStops.find((s) => s.id === a.stopId);
        const passes = this.transportPasses.filter((p) => p.allotmentId === a.id);
        return { ...a, student, vehicle, route, stop, passes };
      });
    },
    count: async (args?: any) => {
      let list = [...this.transportAllotments];
      if (args?.where?.vehicleId) list = list.filter((a) => a.vehicleId === args.where.vehicleId);
      if (args?.where?.status) list = list.filter((a) => a.status === args.where.status);
      return list.length;
    },
    update: async (args: any) => {
      const idx = this.transportAllotments.findIndex((a) => a.id === args.where.id);
      if (idx !== -1) {
        this.transportAllotments[idx] = { ...this.transportAllotments[idx], ...args.data, updatedAt: new Date() };
        const student = this.students.find((s) => s.id === this.transportAllotments[idx].studentId);
        const vehicle = this.vehicles.find((v) => v.id === this.transportAllotments[idx].vehicleId);
        const route = this.transportRoutes.find((r) => r.id === this.transportAllotments[idx].routeId);
        const stop = this.transportStops.find((s) => s.id === this.transportAllotments[idx].stopId);
        return { ...this.transportAllotments[idx], student, vehicle, route, stop };
      }
      return null;
    },
  };

  transportPass = {
    create: async (args: any) => {
      const newP = { id: `pass-${this.transportPasses.length + 1}`, ...args.data, issuedAt: new Date() };
      this.transportPasses.push(newP);
      return newP;
    },
    updateMany: async (args: any) => {
      let count = 0;
      this.transportPasses.forEach((p) => {
        if (p.allotmentId === args.where.allotmentId && p.status === args.where.status) {
          Object.assign(p, args.data);
          count++;
        }
      });
      return { count };
    },
  };

  transportApplication = {
    create: async (args: any) => {
      const newReq = { id: `app-${this.transportApplications.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.transportApplications.push(newReq);
      const student = this.students.find((s) => s.id === newReq.studentId);
      const route = this.transportRoutes.find((r) => r.id === newReq.routeId);
      const stop = this.transportStops.find((s) => s.id === newReq.stopId);
      return { ...newReq, student, route, stop };
    },
    findUnique: async (args: any) => {
      const app = this.transportApplications.find((a) => a.id === args.where.id);
      if (!app) return null;
      const student = this.students.find((s) => s.id === app.studentId);
      const route = this.transportRoutes.find((r) => r.id === app.routeId);
      const stop = this.transportStops.find((s) => s.id === app.stopId);
      return { ...app, student, route, stop };
    },
    findMany: async (args?: any) => {
      let list = [...this.transportApplications];
      if (args?.where?.studentId) list = list.filter((a) => a.studentId === args.where.studentId);
      if (args?.where?.status) list = list.filter((a) => a.status === args.where.status);
      return list.map((a) => {
        const student = this.students.find((s) => s.id === a.studentId);
        const route = this.transportRoutes.find((r) => r.id === a.routeId);
        const stop = this.transportStops.find((s) => s.id === a.stopId);
        return { ...a, student, route, stop };
      });
    },
    update: async (args: any) => {
      const idx = this.transportApplications.findIndex((a) => a.id === args.where.id);
      if (idx !== -1) {
        this.transportApplications[idx] = { ...this.transportApplications[idx], ...args.data, updatedAt: new Date() };
        const student = this.students.find((s) => s.id === this.transportApplications[idx].studentId);
        const route = this.transportRoutes.find((r) => r.id === this.transportApplications[idx].routeId);
        const stop = this.transportStops.find((s) => s.id === this.transportApplications[idx].stopId);
        return { ...this.transportApplications[idx], student, route, stop };
      }
      return null;
    },
    count: async (args?: any) => {
      if (args?.where?.status) return this.transportApplications.filter((a) => a.status === args.where.status).length;
      return this.transportApplications.length;
    },
  };

  vehicleMaintenance = {
    create: async (args: any) => {
      const newM = { id: `mnt-${this.vehicleMaintenances.length + 1}`, ...args.data, createdAt: new Date(), updatedAt: new Date() };
      this.vehicleMaintenances.push(newM);
      const vehicle = this.vehicles.find((v) => v.id === newM.vehicleId);
      return { ...newM, vehicle };
    },
    findUnique: async (args: any) => {
      return this.vehicleMaintenances.find((m) => m.id === args.where.id) || null;
    },
    findMany: async (args?: any) => {
      let list = [...this.vehicleMaintenances];
      if (args?.where?.vehicleId) list = list.filter((m) => m.vehicleId === args.where.vehicleId);
      if (args?.where?.status) list = list.filter((m) => m.status === args.where.status);
      return list.map((m) => {
        const vehicle = this.vehicles.find((v) => v.id === m.vehicleId);
        return { ...m, vehicle };
      });
    },
    update: async (args: any) => {
      const idx = this.vehicleMaintenances.findIndex((m) => m.id === args.where.id);
      if (idx !== -1) {
        this.vehicleMaintenances[idx] = { ...this.vehicleMaintenances[idx], ...args.data, updatedAt: new Date() };
        const vehicle = this.vehicles.find((v) => v.id === this.vehicleMaintenances[idx].vehicleId);
        return { ...this.vehicleMaintenances[idx], vehicle };
      }
      return null;
    },
  };

  transportTrip = {
    create: async (args: any) => {
      const newT = { id: `trp-${this.transportTrips.length + 1}`, ...args.data, createdAt: new Date() };
      this.transportTrips.push(newT);
      const vehicle = this.vehicles.find((v) => v.id === newT.vehicleId);
      const route = this.transportRoutes.find((r) => r.id === newT.routeId);
      const driver = this.driverProfiles.find((d) => d.id === newT.driverId);
      return { ...newT, vehicle, route, driver };
    },
    findMany: async (args?: any) => {
      let list = [...this.transportTrips];
      if (args?.where?.driverId) list = list.filter((t) => t.driverId === args.where.driverId);
      if (args?.where?.routeId) list = list.filter((t) => t.routeId === args.where.routeId);
      if (args?.where?.vehicleId) list = list.filter((t) => t.vehicleId === args.where.vehicleId);
      return list.map((t) => {
        const vehicle = this.vehicles.find((v) => v.id === t.vehicleId);
        const route = this.transportRoutes.find((r) => r.id === t.routeId);
        const driver = this.driverProfiles.find((d) => d.id === t.driverId);
        return { ...t, vehicle, route, driver };
      });
    },
  };
}

// ── Runner ──────────────────────────────────────────────────────────────────
async function runPhase8Tests() {
  console.log('\n===============================================================');
  console.log('PHASE 8 — UNIVERSITY TRANSPORT MANAGEMENT TEST SUITE');
  console.log('===============================================================\n');

  const mockPrisma = new MockPrismaService();
  const service = new TransportService(mockPrisma as any);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${description}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${description}`);
      failed++;
    }
  }

  // 1. Vehicle Master Creation & Unique Registration Number
  console.log('▶ Scenario 1: Vehicle Master Creation & Unique Registration Enforcement');
  const v1 = await service.createVehicle({
    vehicleNumber: 'BUS-01',
    registrationNumber: 'GJ-01-AB-1234',
    vehicleType: VehicleTypeEnum.BUS,
    makeModel: 'Tata Starbus Ultra 40 Seater',
    capacity: 2, // Set small capacity for test Scenario 10
    fuelType: 'DIESEL',
    insuranceNumber: 'POL-ICICI-2026-9999',
    insuranceExpiry: '2027-08-31',
    fitnessCertificateNumber: 'FIT-RTO-2026-4444',
    fitnessExpiry: '2027-08-31',
    permitNumber: 'PERMIT-GUJ-8888',
    permitExpiry: '2028-06-30',
    pollutionCertificateNumber: 'PUC-2026-5555',
    pucExpiry: '2026-12-31',
    status: VehicleStatusEnum.ACTIVE,
  });
  assert(v1.registrationNumber === 'GJ-01-AB-1234' && v1.capacity === 2, 'Vehicle GJ-01-AB-1234 registered successfully');

  let dupVehCaught = false;
  try {
    await service.createVehicle({
      registrationNumber: 'GJ-01-AB-1234',
      makeModel: 'Duplicate Bus',
    });
  } catch (err) {
    dupVehCaught = true;
  }
  assert(dupVehCaught, 'Prevented registration of duplicate vehicle registration number');

  // 2. Vehicle Document Upload & Expiry Computation
  console.log('\n▶ Scenario 2: Vehicle Document Compliance Upload');
  const vdoc = await service.uploadVehicleDocument(
    v1.id,
    {
      docType: VehicleDocumentTypeEnum.INSURANCE,
      docNumber: 'POL-ICICI-2026-9999',
      issueDate: '2025-08-31',
      expiryDate: '2027-08-31',
      docUrl: 'https://cdn.ssiu.edu.in/transport/insurance_bus01.pdf',
    },
    'Transport Officer'
  );
  assert(vdoc.docType === 'INSURANCE' && vdoc.status === 'VALID', 'Uploaded valid Insurance Document');

  // 3. Driver Profile Master & Unique License Validation
  console.log('\n▶ Scenario 3: Driver Profile Registration & Unique License Validation');
  const drv1 = await service.createDriver({
    driverId: 'DRV-001',
    driverName: 'Rameshwar Yadav',
    contactNumber: '9825123456',
    licenseNumber: 'GJ01-20150045678',
    licenseType: 'HEAVY_VEHICLE',
    licenseExpiry: '2029-05-15',
    experienceYears: 8.5,
    status: DriverStatusEnum.ACTIVE,
  });
  assert(drv1.licenseNumber === 'GJ01-20150045678', 'Driver Rameshwar Yadav registered successfully');

  let dupLicCaught = false;
  try {
    await service.createDriver({
      driverName: 'Duplicate Driver',
      contactNumber: '9825999999',
      licenseNumber: 'GJ01-20150045678',
    });
  } catch (err) {
    dupLicCaught = true;
  }
  assert(dupLicCaught, 'Duplicate driver license number strictly rejected');

  // 4. Driver Document Upload & Expired License Guard
  console.log('\n▶ Scenario 4: Driver Document Upload & Expired License Assignment Guard');
  const ddoc = await service.uploadDriverDocument(
    drv1.id,
    {
      docType: DriverDocumentTypeEnum.DRIVING_LICENSE,
      docNumber: 'GJ01-20150045678',
      expiryDate: '2029-05-15',
      docUrl: 'https://cdn.ssiu.edu.in/transport/dl_rameshwar.pdf',
    },
    'Transport Admin'
  );
  assert(ddoc.status === 'VALID', 'Driver License Document recorded as VALID');

  // Register an expired driver to test safety guard
  const expiredDrv = await service.createDriver({
    driverId: 'DRV-002',
    driverName: 'Kishore Parmar',
    contactNumber: '9825000002',
    licenseNumber: 'GJ01-20000012345',
    licenseExpiry: '2020-01-01', // Expired!
    status: DriverStatusEnum.ACTIVE,
  });

  let expiredDutyCaught = false;
  try {
    await service.assignDriverToVehicle({
      vehicleId: v1.id,
      driverId: expiredDrv.id,
    });
  } catch (err) {
    expiredDutyCaught = true;
  }
  assert(expiredDutyCaught, 'Driver with expired driving license blocked from active duty assignment');

  // 5. Driver-to-Vehicle Assignment
  console.log('\n▶ Scenario 5: Driver-to-Vehicle Assignment & Overlap Detection');
  const assignment1 = await service.assignDriverToVehicle({
    vehicleId: v1.id,
    driverId: drv1.id,
    isPrimary: true,
  });
  assert(assignment1.status === 'ACTIVE' && assignment1.driverId === drv1.id, 'Driver assigned to Bus 01 as primary driver');

  // 6. Route Creation & Unique Route Code
  console.log('\n▶ Scenario 6: Route Creation & Unique Code Constraint');
  const r1 = await service.createRoute({
    routeNumber: 'R-101',
    routeName: 'Ahmedabad ISKCON — SSIU Campus',
    startPoint: 'ISKCON Cross Roads',
    endPoint: 'SSIU Main Campus, Gandhinagar',
    distanceKm: 28.5,
    estDurationMins: 50,
    monthlyFee: 2500,
    stops: [
      { stopName: 'ISKCON Cross Roads', sequence: 1, pickupTime: '07:15 AM', dropTime: '05:45 PM' },
      { stopName: 'Pakwan Cross Roads', sequence: 2, pickupTime: '07:25 AM', dropTime: '05:35 PM' },
    ],
  });
  assert(r1.routeNumber === 'R-101' && r1.stops.length === 2, 'Route R-101 registered with 2 initial stops');

  let dupRouteCaught = false;
  try {
    await service.createRoute({
      routeNumber: 'R-101',
      routeName: 'Duplicate Route',
      startPoint: 'A',
      endPoint: 'B',
    });
  } catch (err) {
    dupRouteCaught = true;
  }
  assert(dupRouteCaught, 'Duplicate route number blocked');

  // 7. Route Stops Sequence Validation
  console.log('\n▶ Scenario 7: Sequential Route Stops & Duplicate Sequence Prevention');
  const stop3 = await service.addRouteStop(r1.id, {
    stopName: 'Infocity Circle',
    sequence: 3,
    pickupTime: '07:45 AM',
    dropTime: '05:15 PM',
  });
  assert(stop3.sequence === 3, 'Stop #3 added successfully');

  let dupSeqCaught = false;
  try {
    await service.addRouteStop(r1.id, {
      stopName: 'Duplicate Seq Stop',
      sequence: 3,
      pickupTime: '07:50 AM',
      dropTime: '05:10 PM',
    });
  } catch (err) {
    dupSeqCaught = true;
  }
  assert(dupSeqCaught, 'Duplicate sequence number on same route strictly rejected');

  // 8. Vehicle-to-Route Assignment
  console.log('\n▶ Scenario 8: Vehicle-to-Route Mapping');
  const vrMap = await service.assignVehicleToRoute({
    vehicleId: v1.id,
    routeId: r1.id,
    shiftType: 'REGULAR',
  });
  assert(vrMap.status === 'ACTIVE', 'Vehicle assigned to Route R-101');

  // 9. Student Transport Allocation & Duplicate Prevention
  console.log('\n▶ Scenario 9: Student Transport Allocation & Duplicate Active Check');
  const allot1 = await service.allocateStudentTransport({
    studentId: 'stud-01',
    routeId: r1.id,
    stopId: stop3.id,
    vehicleId: v1.id,
  });
  assert(allot1.status === 'ACTIVE' && allot1.allotmentNo.startsWith('TRN-ALL-2026-'), 'Student 1 allocated seat on Bus 01');

  let dupAllotCaught = false;
  try {
    await service.allocateStudentTransport({
      studentId: 'stud-01',
      routeId: r1.id,
      stopId: stop3.id,
      vehicleId: v1.id,
    });
  } catch (err) {
    dupAllotCaught = true;
  }
  assert(dupAllotCaught, 'Duplicate active transport allocation for same student blocked');

  // 10. Vehicle Capacity Enforcement
  console.log('\n▶ Scenario 10: Strict Vehicle Capacity Enforcement');
  const allot2 = await service.allocateStudentTransport({
    studentId: 'stud-02',
    routeId: r1.id,
    stopId: stop3.id,
    vehicleId: v1.id,
  });
  assert(allot2.status === 'ACTIVE', 'Student 2 allocated seat (Bus now 2/2 full)');

  let capacityOverflowCaught = false;
  try {
    await service.allocateStudentTransport({
      studentId: 'stud-03',
      routeId: r1.id,
      stopId: stop3.id,
      vehicleId: v1.id,
    });
  } catch (err: any) {
    capacityOverflowCaught = true;
  }
  assert(capacityOverflowCaught, 'Allocation rejected when vehicle capacity is full (2/2)');

  // 11. Student Scoped View
  console.log('\n▶ Scenario 11: Student Scoped "My Transport" View');
  const studentView = await service.getStudentTransportView('stud-01');
  assert(
    studentView.activeAllotment?.allotmentNo === allot1.allotmentNo &&
      studentView.activeAllotment?.studentId === 'stud-01',
    'Student views only their own transport allotment and route'
  );

  // 12. Driver Duty View
  console.log('\n▶ Scenario 12: Driver Scoped "My Duty" View');
  const driverDuty = await service.getDriverDutySchedule(drv1.id);
  assert(
    driverDuty.activeAssignments.length === 1 &&
      driverDuty.activeAssignments[0].vehicleId === v1.id,
    'Driver views assigned vehicle Bus 01 in duty roster'
  );

  // 13. Student Transport Requests Workflow
  console.log('\n▶ Scenario 13: Student Transport Requests Workflow');
  const req1 = await service.createTransportRequest('stud-03', {
    routeId: r1.id,
    stopId: stop3.id,
    remarks: 'Requesting seat on Route 101 Infocity stop',
  });
  assert(req1.status === 'SUBMITTED' && req1.applicationNo.startsWith('TRN-APP-2026-'), 'Submitted new transport request');

  const approvedReq = await service.updateTransportRequestStatus(
    req1.id,
    { status: 'APPROVED' },
    'Transport Admin'
  );
  assert(approvedReq.status === 'APPROVED', 'Transport request approved by Admin');

  // 14. Vehicle Maintenance & Notesheet Integration
  console.log('\n▶ Scenario 14: Vehicle Maintenance & Notesheet Integration');
  const mnt1 = await service.createMaintenance({
    vehicleId: v1.id,
    issue: 'Front brake caliper servicing and pad replacement',
    category: MaintenanceCategoryEnum.BRAKES,
    priority: MaintenancePriorityEnum.HIGH,
    estimatedCost: 4500,
    notesheetId: 'NS/TRANSPORT/2026/0014',
  });
  assert(mnt1.maintenanceNo.startsWith('MNT-VEH-2026-') && mnt1.status === 'REPORTED', 'Created maintenance log with Notesheet link');

  const completedMnt = await service.updateMaintenance(mnt1.id, {
    status: 'COMPLETED',
    actualCost: 4800,
  });
  assert(completedMnt.status === 'COMPLETED' && Number(completedMnt.actualCost) === 4800, 'Maintenance marked COMPLETED with actual cost recorded');

  // 15. Trip Scheduling
  console.log('\n▶ Scenario 15: Trip Scheduling & Daily Duty Run');
  const trip1 = await service.createTrip({
    vehicleId: v1.id,
    routeId: r1.id,
    driverId: drv1.id,
    tripDate: '2026-08-18',
    shift: 'MORNING',
    startTime: '07:00 AM',
    endTime: '08:30 AM',
    tripType: TripTypeEnum.PICKUP,
  });
  assert(trip1.tripNo.startsWith('TRP-2026-') && trip1.status === 'SCHEDULED', 'Scheduled daily morning pickup trip');

  // 16. Fleet Expiry Alerts
  console.log('\n▶ Scenario 16: Fleet Document Expiry Alerts');
  const alerts = await service.getFleetExpiryAlerts(30);
  assert(alerts.totalExpired >= 1, 'Detected expired driver license in fleet alerts');

  // 17. 12 Standard Reports
  console.log('\n▶ Scenario 17: Standard Transport Reports Engine');
  const vehReport: any = await service.getTransportReports('VEHICLE_LIST');
  assert(vehReport.length === 1 && vehReport[0].registrationNumber === 'GJ-01-AB-1234', 'Generated Vehicle List Report');

  const capReport: any = await service.getTransportReports('VEHICLE_CAPACITY');
  assert(capReport.length === 1 && capReport[0].capacity === 2 && capReport[0].allocated === 2, 'Generated Vehicle Capacity Report');

  const allotReport: any = await service.getTransportReports('STUDENT_ALLOCATION');
  assert(allotReport.length === 2, 'Generated Student Allocation Master Report');

  // Summary
  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: Total ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
