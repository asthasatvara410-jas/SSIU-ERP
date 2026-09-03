import { Test, TestingModule } from '@nestjs/testing';
import { TransportService } from './src/transport/transport.service';
import { PrismaService } from './src/prisma/prisma.service';
import { TransportController } from './src/transport/transport.controller';
import {
  VehicleTypeEnum,
  FuelTypeEnum,
  VehicleStatusEnum,
  DriverStatusEnum,
  VehicleDocumentTypeEnum,
} from './src/transport/dto/transport.dto';

async function runTransportTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPLETE TRANSPORT & FLEET TEST SUITE');
  console.log('====================================================\n');

  // In-memory data store
  const store = {
    vehicles: new Map<string, any>(),
    vehicleDocs: new Map<string, any>(),
    drivers: new Map<string, any>(),
    vehicleDriverMappings: new Map<string, any>(),
    routes: new Map<string, any>(),
    stops: new Map<string, any>(),
    vehicleRouteMappings: new Map<string, any>(),
    allotments: new Map<string, any>(),
    applications: new Map<string, any>(),
    passes: new Map<string, any>(),
  };

  const mockPrismaService = {
    vehicle: {
      create: async ({ data }: any) => {
        const id = 'veh-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.vehicles.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        const found = Array.from(store.vehicles.values()).find(
          (v) => v.id === where.id || (where.registrationNumber && v.registrationNumber === where.registrationNumber)
        );
        if (!found) return null;
        const docs = Array.from(store.vehicleDocs.values()).filter((d) => d.vehicleId === found.id);
        const driverMaps = Array.from(store.vehicleDriverMappings.values())
          .filter((m) => m.vehicleId === found.id)
          .map((m) => ({ ...m, driver: store.drivers.get(m.driverId) }));
        const routeMaps = Array.from(store.vehicleRouteMappings.values())
          .filter((m) => m.vehicleId === found.id)
          .map((m) => ({ ...m, route: store.routes.get(m.routeId) }));
        return { ...found, documents: docs, driverMappings: driverMaps, routeMappings: routeMaps, allotments: [], maintenances: [] };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.vehicles.values());
        if (where?.vehicleType) list = list.filter((v) => v.vehicleType === where.vehicleType);
        if (where?.status) list = list.filter((v) => v.status === where.status);
        if (where?.OR) {
          const search = (where.OR[0]?.registrationNumber?.contains || '').toLowerCase();
          list = list.filter(
            (v) =>
              v.registrationNumber.toLowerCase().includes(search) ||
              v.makeModel.toLowerCase().includes(search)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((v) => ({
          ...v,
          documents: Array.from(store.vehicleDocs.values()).filter((d) => d.vehicleId === v.id),
          driverMappings: Array.from(store.vehicleDriverMappings.values())
            .filter((m) => m.vehicleId === v.id && m.status === 'ACTIVE')
            .map((m) => ({ ...m, driver: store.drivers.get(m.driverId) })),
          routeMappings: Array.from(store.vehicleRouteMappings.values())
            .filter((m) => m.vehicleId === v.id && m.status === 'ACTIVE')
            .map((m) => ({ ...m, route: store.routes.get(m.routeId) })),
          _count: { allotments: 0 },
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.vehicles.values());
        if (where?.status) list = list.filter((v) => v.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.vehicles.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.vehicles.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: any) => {
        const existing = store.vehicles.get(where.id);
        store.vehicles.delete(where.id);
        return existing;
      },
    },

    vehicleDocument: {
      create: async ({ data }: any) => {
        const id = 'doc-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.vehicleDocs.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => store.vehicleDocs.get(where.id),
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.vehicleDocs.values()).filter((d) => !where?.vehicleId || d.vehicleId === where.vehicleId);
      },
      delete: async ({ where }: any) => {
        const existing = store.vehicleDocs.get(where.id);
        store.vehicleDocs.delete(where.id);
        return existing;
      },
    },

    driverProfile: {
      create: async ({ data }: any) => {
        const id = 'drv-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.drivers.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => {
        const found = Array.from(store.drivers.values()).find(
          (d) => d.id === where.id || (where.licenseNumber && d.licenseNumber === where.licenseNumber)
        );
        if (!found) return null;
        const vMaps = Array.from(store.vehicleDriverMappings.values())
          .filter((m) => m.driverId === found.id)
          .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId) }));
        return { ...found, vehicleMappings: vMaps, trips: [], incidents: [] };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.drivers.values());
        if (where?.status) list = list.filter((d) => d.status === where.status);
        if (where?.OR) {
          const search = (where.OR[0]?.driverName?.contains || '').toLowerCase();
          list = list.filter(
            (d) =>
              d.driverName.toLowerCase().includes(search) ||
              d.licenseNumber.toLowerCase().includes(search)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((d) => ({
          ...d,
          vehicleMappings: Array.from(store.vehicleDriverMappings.values())
            .filter((m) => m.driverId === d.id && m.status === 'ACTIVE')
            .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId) })),
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.drivers.values());
        if (where?.status) list = list.filter((d) => d.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.drivers.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.drivers.set(where.id, updated);
        return updated;
      },
      delete: async ({ where }: any) => {
        const existing = store.drivers.get(where.id);
        store.drivers.delete(where.id);
        return existing;
      },
    },

    vehicleDriverMapping: {
      create: async ({ data }: any) => {
        const id = 'vdm-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.vehicleDriverMappings.set(id, record);
        return { ...record, vehicle: store.vehicles.get(record.vehicleId), driver: store.drivers.get(record.driverId) };
      },
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.vehicleDriverMappings.values())
          .filter((m) => (!where?.vehicleId || m.vehicleId === where.vehicleId) && (!where?.status || m.status === where.status))
          .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId), driver: store.drivers.get(m.driverId) }));
      },
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        for (const [id, record] of store.vehicleDriverMappings.entries()) {
          if (record.vehicleId === where.vehicleId && (!where.status || record.status === where.status) && (!where.isPrimary || record.isPrimary === where.isPrimary)) {
            store.vehicleDriverMappings.set(id, { ...record, ...data, updatedAt: new Date() });
            count++;
          }
        }
        return { count };
      },
    },

    transportRoute: {
      create: async ({ data }: any) => {
        const id = 'rte-' + Math.random().toString(36).substr(2, 6);
        const { stops, ...rest } = data;
        const record = { id, ...rest, createdAt: new Date(), updatedAt: new Date() };
        store.routes.set(id, record);
        if (stops?.create) {
          for (const s of stops.create) {
            const stopId = 'stp-' + Math.random().toString(36).substr(2, 6);
            store.stops.set(stopId, { id: stopId, routeId: id, ...s, createdAt: new Date() });
          }
        }
        const createdStops = Array.from(store.stops.values()).filter((s) => s.routeId === id);
        return { ...record, stops: createdStops };
      },
      findUnique: async ({ where }: any) => {
        const found = Array.from(store.routes.values()).find(
          (r) => r.id === where.id || (where.routeNumber && r.routeNumber === where.routeNumber)
        );
        if (!found) return null;
        const stops = Array.from(store.stops.values()).filter((s) => s.routeId === found.id);
        const vMaps = Array.from(store.vehicleRouteMappings.values())
          .filter((m) => m.routeId === found.id)
          .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId) }));
        return { ...found, stops, vehicleMappings: vMaps, allotments: [] };
      },
      findMany: async ({ where, skip, take }: any = {}) => {
        let list = Array.from(store.routes.values());
        if (where?.status) list = list.filter((r) => r.status === where.status);
        if (where?.OR) {
          const search = (where.OR[0]?.routeNumber?.contains || '').toLowerCase();
          list = list.filter(
            (r) =>
              r.routeNumber.toLowerCase().includes(search) ||
              r.routeName.toLowerCase().includes(search)
          );
        }
        const sliced = list.slice(skip || 0, (skip || 0) + (take || 10));
        return sliced.map((r) => ({
          ...r,
          stops: Array.from(store.stops.values()).filter((s) => s.routeId === r.id),
          vehicleMappings: Array.from(store.vehicleRouteMappings.values())
            .filter((m) => m.routeId === r.id && m.status === 'ACTIVE')
            .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId) })),
          _count: { allotments: 0, applications: 0 },
        }));
      },
      count: async ({ where }: any = {}) => {
        let list = Array.from(store.routes.values());
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.length;
      },
      update: async ({ where, data }: any) => {
        const existing = store.routes.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.routes.set(where.id, updated);
        const stops = Array.from(store.stops.values()).filter((s) => s.routeId === where.id);
        return { ...updated, stops };
      },
      delete: async ({ where }: any) => {
        const existing = store.routes.get(where.id);
        store.routes.delete(where.id);
        return existing;
      },
    },

    transportStop: {
      create: async ({ data }: any) => {
        const id = 'stp-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date() };
        store.stops.set(id, record);
        return record;
      },
      findUnique: async ({ where }: any) => store.stops.get(where.id),
      delete: async ({ where }: any) => {
        const existing = store.stops.get(where.id);
        store.stops.delete(where.id);
        return existing;
      },
    },

    vehicleRouteMapping: {
      create: async ({ data }: any) => {
        const id = 'vrm-' + Math.random().toString(36).substr(2, 6);
        const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.vehicleRouteMappings.set(id, record);
        return { ...record, vehicle: store.vehicles.get(record.vehicleId), route: store.routes.get(record.routeId) };
      },
      findUnique: async ({ where }: any) => store.vehicleRouteMappings.get(where.id),
      findMany: async ({ where }: any = {}) => {
        return Array.from(store.vehicleRouteMappings.values())
          .filter(
            (m) =>
              (!where?.routeId || m.routeId === where.routeId) &&
              (!where?.vehicleId || m.vehicleId === where.vehicleId) &&
              (!where?.status || m.status === where.status)
          )
          .map((m) => ({ ...m, vehicle: store.vehicles.get(m.vehicleId), route: store.routes.get(m.routeId) }));
      },
      update: async ({ where, data }: any) => {
        const existing = store.vehicleRouteMappings.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        store.vehicleRouteMappings.set(where.id, updated);
        return updated;
      },
    },

    transportAllotment: {
      count: async () => store.allotments.size,
    },
    transportApplication: {
      count: async () => store.applications.size,
    },

    $transaction: async (cb: any) => cb(mockPrismaService),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TransportService,
      { provide: PrismaService, useValue: mockPrismaService },
    ],
  }).compile();

  const service = module.get<TransportService>(TransportService);

  let passed = 0;
  let failed = 0;

  function assert(testName: string, condition: boolean, extra?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // ── 1. VEHICLE MANAGEMENT ─────────────────────────────────────────────────
  console.log('--- 1. Vehicle Registration & CRUD ---');
  const bus1 = await service.createVehicle({
    registrationNumber: 'GJ-01-AB-1234',
    vehicleType: VehicleTypeEnum.BUS,
    makeModel: 'Tata Starbus 40 Seater',
    capacity: 40,
    fuelType: FuelTypeEnum.DIESEL,
    chassisNumber: 'MAT400011K12345',
    engineNumber: 'ENG9876543',
    rcNumber: 'RC-GJ01-2024-001',
    insuranceExpiry: '2026-09-01', // Expiring soon (<60 days)
    fitnessExpiry: '2027-01-15',
    pucExpiry: '2026-08-30', // Expiring soon
    permitExpiry: '2028-06-30',
  });

  assert('Vehicle created with registration number GJ-01-AB-1234', bus1.registrationNumber === 'GJ-01-AB-1234');
  assert('Vehicle capacity and fuel recorded', bus1.capacity === 40 && bus1.fuelType === 'DIESEL');

  // Upload vehicle document
  const doc = await service.uploadVehicleDocument(bus1.id, {
    docType: VehicleDocumentTypeEnum.INSURANCE,
    docNumber: 'POL-ICICI-2026-9999',
    expiryDate: '2026-09-01',
    docUrl: 'https://cdn.ssiu.edu.in/transport/insurance_bus1.pdf',
  });
  assert('Vehicle compliance document uploaded', doc.docType === 'INSURANCE' && doc.docNumber === 'POL-ICICI-2026-9999');

  const docs = await service.getVehicleDocuments(bus1.id);
  assert('Retrieved vehicle uploaded documents', docs.length >= 1);

  // Update vehicle
  const updatedBus = await service.updateVehicle(bus1.id, {
    status: VehicleStatusEnum.ACTIVE,
    capacity: 42,
  });
  assert('Vehicle updated with revised capacity', updatedBus.capacity === 42);

  // ── 2. DRIVER MANAGEMENT ──────────────────────────────────────────────────
  console.log('\n--- 2. Driver Profile Registration & CRUD ---');
  const driver1 = await service.createDriver({
    driverName: 'Rameshwar Yadav',
    contactNumber: '9825123456',
    licenseNumber: 'GJ01-20150045678',
    licenseType: 'HEAVY_VEHICLE',
    licenseExpiry: '2026-09-10', // Expiring soon (<60 days)
    experienceYears: 8.5,
    address: 'Plot 42, Sector 21, Gandhinagar',
    emergencyContact: '9825199999 (Son: Anil Yadav)',
    driverPhotoUrl: 'https://cdn.ssiu.edu.in/transport/driver_rameshwar.jpg',
    documentUrl: 'https://cdn.ssiu.edu.in/transport/dl_rameshwar.pdf',
  });

  assert('Driver created with heavy vehicle license', driver1.licenseNumber === 'GJ01-20150045678');
  assert('Driver emergency contact and photo recorded', driver1.emergencyContact?.includes('Anil') || false);

  const driver2 = await service.createDriver({
    driverName: 'Jagdishbhai Rathod',
    contactNumber: '9879012345',
    licenseNumber: 'GJ01-20180098765',
    licenseType: 'HEAVY_VEHICLE',
    licenseExpiry: '2029-03-31',
    experienceYears: 12,
  });
  assert('Second driver registered successfully', driver2.driverName === 'Jagdishbhai Rathod');

  // ── 3. VEHICLE-DRIVER MAPPING ─────────────────────────────────────────────
  console.log('\n--- 3. Vehicle-Driver Assignment & Replacement ---');
  const assignment1 = await service.assignDriverToVehicle({
    vehicleId: bus1.id,
    driverId: driver1.id,
    isPrimary: true,
    remarks: 'Initial primary driver allocation for ISKCON route',
  });
  assert('Driver 1 assigned to Bus 1 as primary driver', assignment1.driverId === driver1.id && assignment1.status === 'ACTIVE');

  // Reassign / Change Driver
  const assignment2 = await service.assignDriverToVehicle({
    vehicleId: bus1.id,
    driverId: driver2.id,
    isPrimary: true,
    remarks: 'Driver 1 on leave, substituted with Driver 2',
  });
  assert('Driver 2 assigned to Bus 1 as new primary driver', assignment2.driverId === driver2.id && assignment2.status === 'ACTIVE');

  // Verify assignment history
  const history = await service.getVehicleDriverHistory(bus1.id);
  assert('Vehicle driver assignment history maintained', history.length >= 2);
  assert('Previous primary driver marked REPLACED', history.some((h) => h.driverId === driver1.id && h.status === 'REPLACED'));

  // ── 4. ROUTE & STOPS MANAGEMENT ───────────────────────────────────────────
  console.log('\n--- 4. Transport Route & Stops Management ---');
  const route1 = await service.createRoute({
    routeNumber: 'R-101',
    routeName: 'Ahmedabad ISKCON — Gandhinagar Campus',
    startPoint: 'ISKCON Cross Roads',
    endPoint: 'SSIU Main Campus, Gandhinagar',
    distanceKm: 28.5,
    estDurationMins: 50,
    monthlyFee: 2500,
    stops: [
      { stopName: 'ISKCON Cross Roads', sequence: 1, pickupTime: '07:15 AM', dropTime: '06:00 PM' },
      { stopName: 'Pakwan Cross Roads', sequence: 2, pickupTime: '07:25 AM', dropTime: '05:50 PM' },
      { stopName: 'Thaltej Metro Station', sequence: 3, pickupTime: '07:35 AM', dropTime: '05:40 PM' },
      { stopName: 'SSIU Campus Main Gate', sequence: 4, pickupTime: '08:05 AM', dropTime: '05:10 PM' },
    ],
  });

  assert('Route created with routeNumber R-101', route1.routeNumber === 'R-101');
  assert('Created 4 stops with sequence and timing', route1.stops.length === 4);

  // Add stop to existing route
  const newStop = await service.addRouteStop(route1.id, {
    stopName: 'Science City Approach',
    sequence: 5,
    pickupTime: '07:45 AM',
    dropTime: '05:30 PM',
  });
  assert('New stop added to route successfully', newStop.stopName === 'Science City Approach');

  // ── 5. VEHICLE-ROUTE MAPPING ──────────────────────────────────────────────
  console.log('\n--- 5. Vehicle-Route Assignment ---');
  const routeMapping = await service.assignVehicleToRoute({
    vehicleId: bus1.id,
    routeId: route1.id,
    shiftType: 'REGULAR',
    remarks: 'Daily morning and evening student transit',
  });
  assert('Bus 1 assigned to Route R-101', routeMapping.vehicleId === bus1.id && routeMapping.routeId === route1.id);

  const activeRouteMappings = await service.getVehicleRouteMappings(route1.id);
  assert('Retrieved active buses on Route R-101', activeRouteMappings.length >= 1);

  // ── 6. EXPIRY ALERTS & FLEET METRICS ──────────────────────────────────────
  console.log('\n--- 6. Compliance Expiry Alerts & Fleet Dashboard ---');
  const expiryAlerts = await service.getFleetExpiryAlerts();
  assert('Expiry alert engine returned alerts for expiring documents', expiryAlerts.totalAlerts >= 1);
  assert('Detected upcoming vehicle insurance/PUC expiry', expiryAlerts.alerts.some((a) => a.type.startsWith('VEHICLE_')));
  assert('Detected upcoming driver license expiry', expiryAlerts.alerts.some((a) => a.type === 'DRIVER_LICENSE'));

  const metrics = await service.getTransportDashboardMetrics();
  assert('Dashboard metrics returns fleet, route and student statistics', metrics.fleet.totalVehicles >= 1 && metrics.routes.totalRoutes >= 1);

  // ── 7. SEARCH & MULTI-FILTER ──────────────────────────────────────────────
  console.log('\n--- 7. Querying, Multi-filter & Search ---');
  const vehicleSearch = await service.getVehicles({ search: 'GJ-01' });
  assert('Vehicle search by registration number returns matching records', vehicleSearch.data.length >= 1);

  const driverSearch = await service.getDrivers({ search: 'Rameshwar' });
  assert('Driver search by name returns matching driver', driverSearch.data.length >= 1);

  const routeSearch = await service.getRoutes({ search: 'ISKCON' });
  assert('Route search returns matching route', routeSearch.data.length >= 1);

  console.log('\n====================================================');
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTransportTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
