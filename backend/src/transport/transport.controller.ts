import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransportService } from './transport.service';
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
} from './dto/transport.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';

@ApiTags('University Transport & Fleet Management')
@ApiBearerAuth()
@Controller('api/v1/transport')
@UseGuards(JwtAuthGuard, RbacGuard)
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  // ── Reports & Dashboard ───────────────────────────────────────────────────

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Transport Dashboard KPIs & Fleet Statistics' })
  getTransportDashboardMetrics() {
    return this.transportService.getTransportDashboardMetrics();
  }

  @Get('alerts/expiries')
  @ApiOperation({ summary: 'Get fleet expiration alerts (Insurance, Fitness, Permit, PUC, Driver License)' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getFleetExpiryAlerts(@Query('days') days?: number) {
    return this.transportService.getFleetExpiryAlerts(Number(days) || 30);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Generate formatted transport reports' })
  @ApiQuery({ name: 'reportType', required: false, example: 'VEHICLE_LIST' })
  getTransportReports(@Query('reportType') reportType: string, @Query() query: TransportReportQueryDto) {
    return this.transportService.getTransportReports(reportType, query);
  }

  // ── 1. Vehicles ───────────────────────────────────────────────────────────

  @Post('vehicles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add new Vehicle to fleet' })
  createVehicle(@Body() dto: CreateVehicleDto) {
    return this.transportService.createVehicle(dto);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'List Fleet Vehicles with search, pagination, and multi-filter' })
  getVehicles(@Query() query: VehicleQueryDto) {
    return this.transportService.getVehicles(query);
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Get Vehicle details, active drivers, assigned routes & documents' })
  getVehicleById(@Param('id') id: string) {
    return this.transportService.getVehicleById(id);
  }

  @Patch('vehicles/:id')
  @ApiOperation({ summary: 'Update Vehicle specifications and status' })
  updateVehicle(@Param('id') id: string, @Body() dto: UpdateVehicleDto) {
    return this.transportService.updateVehicle(id, dto);
  }

  @Delete('vehicles/:id')
  @ApiOperation({ summary: 'Delete Vehicle from fleet' })
  deleteVehicle(@Param('id') id: string) {
    return this.transportService.deleteVehicle(id);
  }

  @Post('vehicles/:id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload Vehicle document (Insurance, Fitness, RC, Permit, PUC)' })
  uploadVehicleDocument(@Param('id') id: string, @Body() dto: CreateVehicleDocumentDto, @Req() req: any) {
    return this.transportService.uploadVehicleDocument(id, dto, req.user?.name);
  }

  @Get('vehicles/:id/documents')
  @ApiOperation({ summary: 'List Vehicle uploaded compliance documents' })
  getVehicleDocuments(@Param('id') id: string) {
    return this.transportService.getVehicleDocuments(id);
  }

  @Delete('vehicles/documents/:documentId')
  @ApiOperation({ summary: 'Delete Vehicle document' })
  deleteVehicleDocument(@Param('documentId') documentId: string) {
    return this.transportService.deleteVehicleDocument(documentId);
  }

  // ── 2. Drivers ────────────────────────────────────────────────────────────

  @Post('drivers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register Driver profile' })
  createDriver(@Body() dto: CreateDriverDto) {
    return this.transportService.createDriver(dto);
  }

  @Get('drivers')
  @ApiOperation({ summary: 'List Drivers with search, pagination, and status filter' })
  getDrivers(@Query() query: DriverQueryDto) {
    return this.transportService.getDrivers(query);
  }

  @Get('drivers/:id')
  @ApiOperation({ summary: 'Get Driver profile, assigned vehicles & trip history' })
  getDriverById(@Param('id') id: string) {
    return this.transportService.getDriverById(id);
  }

  @Patch('drivers/:id')
  @ApiOperation({ summary: 'Update Driver profile details' })
  updateDriver(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.transportService.updateDriver(id, dto);
  }

  @Delete('drivers/:id')
  @ApiOperation({ summary: 'Delete Driver profile' })
  deleteDriver(@Param('id') id: string) {
    return this.transportService.deleteDriver(id);
  }

  @Post('drivers/:id/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload Driver compliance document' })
  uploadDriverDocument(@Param('id') id: string, @Body() dto: CreateDriverDocumentDto, @Req() req: any) {
    return this.transportService.uploadDriverDocument(id, dto, req.user?.name);
  }

  @Get('drivers/:id/documents')
  @ApiOperation({ summary: 'List Driver compliance documents' })
  getDriverDocuments(@Param('id') id: string) {
    return this.transportService.getDriverDocuments(id);
  }

  @Delete('drivers/documents/:documentId')
  @ApiOperation({ summary: 'Delete Driver document' })
  deleteDriverDocument(@Param('documentId') documentId: string) {
    return this.transportService.deleteDriverDocument(documentId);
  }

  // ── 3. Vehicle-Driver Mapping ─────────────────────────────────────────────

  @Post('vehicle-driver/assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign Driver to Vehicle' })
  assignDriverToVehicle(@Body() dto: AssignDriverToVehicleDto) {
    return this.transportService.assignDriverToVehicle(dto);
  }

  @Get('vehicles/:id/driver-history')
  @ApiOperation({ summary: 'Get Driver assignment history for a Vehicle' })
  getVehicleDriverHistory(@Param('id') id: string) {
    return this.transportService.getVehicleDriverHistory(id);
  }

  // ── 4. Routes & Stops ─────────────────────────────────────────────────────

  @Post('routes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Transport Route with Stops' })
  createRoute(@Body() dto: CreateRouteDto) {
    return this.transportService.createRoute(dto);
  }

  @Get('routes')
  @ApiOperation({ summary: 'List Transport Routes with Stops and active buses' })
  getRoutes(@Query() query: RouteQueryDto) {
    return this.transportService.getRoutes(query);
  }

  @Get('routes/:id')
  @ApiOperation({ summary: 'Get Route details with Stops and passenger allotments' })
  getRouteById(@Param('id') id: string) {
    return this.transportService.getRouteById(id);
  }

  @Patch('routes/:id')
  @ApiOperation({ summary: 'Update Route details' })
  updateRoute(@Param('id') id: string, @Body() dto: UpdateRouteDto) {
    return this.transportService.updateRoute(id, dto);
  }

  @Delete('routes/:id')
  @ApiOperation({ summary: 'Delete Route' })
  deleteRoute(@Param('id') id: string) {
    return this.transportService.deleteRoute(id);
  }

  @Post('routes/:id/stops')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add Stop to Route' })
  addRouteStop(@Param('id') id: string, @Body() dto: CreateRouteStopDto) {
    return this.transportService.addRouteStop(id, dto);
  }

  @Delete('routes/stops/:stopId')
  @ApiOperation({ summary: 'Delete Stop from Route' })
  deleteRouteStop(@Param('stopId') stopId: string) {
    return this.transportService.deleteRouteStop(stopId);
  }

  // ── 5. Vehicle-Route Mapping ──────────────────────────────────────────────

  @Post('vehicle-route/assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign Vehicle to Route' })
  assignVehicleToRoute(@Body() dto: AssignVehicleToRouteDto) {
    return this.transportService.assignVehicleToRoute(dto);
  }

  @Get('vehicle-route/mappings')
  @ApiOperation({ summary: 'List active Vehicle-Route mappings' })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  getVehicleRouteMappings(@Query('routeId') routeId?: string, @Query('vehicleId') vehicleId?: string) {
    return this.transportService.getVehicleRouteMappings(routeId, vehicleId);
  }

  @Delete('vehicle-route/mappings/:id')
  @ApiOperation({ summary: 'Remove Vehicle from Route' })
  removeVehicleRouteMapping(@Param('id') id: string) {
    return this.transportService.removeVehicleRouteMapping(id);
  }

  // ── 6. Student Allocations & Capacity ─────────────────────────────────────

  @Post('student-allocations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Allocate student transport seat with strict capacity check' })
  allocateStudentTransport(@Body() dto: AllocateStudentTransportDto) {
    return this.transportService.allocateStudentTransport(dto);
  }

  @Patch('student-allocations/:id/vacate')
  @ApiOperation({ summary: 'Vacate or cancel student transport seat' })
  vacateStudentTransport(@Param('id') id: string, @Body() dto: VacateStudentTransportDto) {
    return this.transportService.vacateStudentTransport(id, dto);
  }

  @Get('student-allocations')
  @ApiOperation({ summary: 'List student transport allocations' })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  getAllotments(
    @Query('studentId') studentId?: string,
    @Query('routeId') routeId?: string,
    @Query('vehicleId') vehicleId?: string
  ) {
    return this.transportService.getAllotments(studentId, routeId, vehicleId);
  }

  // ── 7. Student Scoped View & Requests ─────────────────────────────────────

  @Get('student/my-transport')
  @ApiOperation({ summary: 'Student views their own transport and pass details' })
  getMyTransport(@Req() req: any) {
    return this.transportService.getStudentTransportView(req.user.studentId || req.user.id);
  }

  @Post('student/requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Student submits transport allocation or change request' })
  createTransportRequest(@Req() req: any, @Body() dto: CreateTransportRequestDto) {
    return this.transportService.createTransportRequest(req.user.studentId || req.user.id, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'List Transport Requests (Scoped for Student, Full for Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  getTransportRequests(@Req() req: any, @Query('status') status?: string, @Query('studentId') studentId?: string) {
    return this.transportService.getTransportRequests(req.user?.role, studentId || req.user?.studentId, status);
  }

  @Patch('requests/:id/status')
  @ApiOperation({ summary: 'Admin approves or rejects transport request' })
  updateTransportRequestStatus(@Param('id') id: string, @Body() dto: UpdateTransportRequestStatusDto, @Req() req: any) {
    return this.transportService.updateTransportRequestStatus(id, dto, req.user?.name);
  }

  // ── 8. Driver Scoped View ─────────────────────────────────────────────────

  @Get('driver/my-duty')
  @ApiOperation({ summary: 'Driver views their assigned vehicles and upcoming trip schedules' })
  getMyDriverDuty(@Req() req: any) {
    return this.transportService.getDriverDutySchedule(req.user.driverId || req.user.id);
  }

  // ── 9. Maintenance ────────────────────────────────────────────────────────

  @Post('maintenance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create vehicle maintenance record with optional Notesheet link' })
  createMaintenance(@Body() dto: CreateVehicleMaintenanceDto) {
    return this.transportService.createMaintenance(dto);
  }

  @Get('maintenance')
  @ApiOperation({ summary: 'List vehicle maintenance logs' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getMaintenances(@Query('vehicleId') vehicleId?: string, @Query('status') status?: string) {
    return this.transportService.getMaintenances(vehicleId, status);
  }

  @Patch('maintenance/:id')
  @ApiOperation({ summary: 'Update maintenance log status and cost' })
  updateMaintenance(@Param('id') id: string, @Body() dto: UpdateVehicleMaintenanceDto) {
    return this.transportService.updateMaintenance(id, dto);
  }

  // ── 10. Trips & Duty Scheduling ───────────────────────────────────────────

  @Post('trips')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule a daily bus trip' })
  createTrip(@Body() dto: CreateTripScheduleDto) {
    return this.transportService.createTrip(dto);
  }

  @Get('trips')
  @ApiOperation({ summary: 'List scheduled trips' })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'routeId', required: false })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'driverId', required: false })
  getTrips(
    @Query('date') date?: string,
    @Query('routeId') routeId?: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('driverId') driverId?: string
  ) {
    return this.transportService.getTrips(date, routeId, vehicleId, driverId);
  }
}
