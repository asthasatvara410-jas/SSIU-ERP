import { Controller, Get, Post, Patch, Put, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Library & Learning Resource Management')
@ApiBearerAuth()
@Controller('api/v1/library')
@UseGuards(JwtAuthGuard, RbacGuard)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  // ── Dashboard ─────────────────────────────────────────────────────────────
  @Get('dashboard')
  @ApiOperation({ summary: 'Get Library Dashboard Metrics (Role Scoped)' })
  getDashboard(@Req() req: any) {
    return this.libraryService.getDashboard(req.user?.id, req.user?.role);
  }

  // ── Library Masters ───────────────────────────────────────────────────────
  @Get('masters/libraries')
  @ApiOperation({ summary: 'List University Libraries' })
  getLibraries() {
    return this.libraryService.getLibraries();
  }

  @Post('masters/libraries')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create University Library' })
  createLibrary(@Body() body: { code: string; name: string; instituteId?: string; location?: string; description?: string }) {
    return this.libraryService.createLibrary(body);
  }

  @Get('masters/sections')
  @ApiOperation({ summary: 'List Library Sections' })
  @ApiQuery({ name: 'libraryId', required: false })
  getSections(@Query('libraryId') libraryId?: string) {
    return this.libraryService.getSections(libraryId);
  }

  @Post('masters/sections')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Library Section' })
  createSection(@Body() body: { libraryId: string; code: string; name: string; description?: string }) {
    return this.libraryService.createSection(body);
  }

  @Get('masters/shelves')
  @ApiOperation({ summary: 'List Library Shelves / Racks' })
  @ApiQuery({ name: 'sectionId', required: false })
  getShelves(@Query('sectionId') sectionId?: string) {
    return this.libraryService.getShelves(sectionId);
  }

  @Post('masters/shelves')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Library Shelf' })
  createShelf(@Body() body: { sectionId: string; shelfNumber: string; floor?: string; capacity?: number }) {
    return this.libraryService.createShelf(body);
  }

  @Get('masters/categories')
  @ApiOperation({ summary: 'List Library Categories' })
  getCategories() {
    return this.libraryService.getCategories();
  }

  @Post('masters/categories')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Library Category' })
  createCategory(@Body() body: { code: string; name: string; description?: string; parentCategoryId?: string }) {
    return this.libraryService.createCategory(body);
  }

  @Get('masters/authors')
  @ApiOperation({ summary: 'List Authors' })
  getAuthors() {
    return this.libraryService.getAuthors();
  }

  @Post('masters/authors')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Author' })
  createAuthor(@Body() body: { name: string; bio?: string; email?: string }) {
    return this.libraryService.createAuthor(body);
  }

  @Get('masters/publishers')
  @ApiOperation({ summary: 'List Publishers' })
  getPublishers() {
    return this.libraryService.getPublishers();
  }

  @Post('masters/publishers')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Publisher' })
  createPublisher(@Body() body: { name: string; address?: string; contact?: string; email?: string }) {
    return this.libraryService.createPublisher(body);
  }

  // ── Book Catalog ──────────────────────────────────────────────────────────
  @Post('books')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Add Book Title to Catalog' })
  createBook(@Body() body: any) {
    return this.libraryService.createBook(body);
  }

  @Put('books/:id')
  @RequirePermission('LIBRARY', 'EDIT')
  @ApiOperation({ summary: 'Update Book Title in Catalog' })
  updateBook(@Param('id') id: string, @Body() body: any) {
    return this.libraryService.updateBook(id, body);
  }

  @Get('books')
  @ApiOperation({ summary: 'List / Filter Book Titles' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'language', required: false })
  @ApiQuery({ name: 'availability', required: false })
  getBooks(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('subjectId') subjectId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('language') language?: string,
    @Query('availability') availability?: string,
  ) {
    return this.libraryService.getBooks({ search, category, subjectId, resourceType, language, availability });
  }

  @Get('books/:id')
  @ApiOperation({ summary: 'Get Book Details with Copies and Reservations' })
  getBookById(@Param('id') id: string) {
    return this.libraryService.getBookById(id);
  }

  // ── Book Physical Copies ──────────────────────────────────────────────────
  @Post('copies')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Add Physical Copy with Accession & Barcode' })
  createBookCopy(@Body() body: any) {
    return this.libraryService.createBookCopy(body);
  }

  @Get('copies')
  @ApiOperation({ summary: 'List Physical Book Copies' })
  @ApiQuery({ name: 'bookId', required: false })
  @ApiQuery({ name: 'libraryId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getCopies(
    @Query('bookId') bookId?: string,
    @Query('libraryId') libraryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.libraryService.getCopies({ bookId, libraryId, status, search });
  }

  @Patch('copies/:id/status')
  @RequirePermission('LIBRARY', 'EDIT')
  @ApiOperation({ summary: 'Update Copy Status or Condition' })
  updateCopyStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('condition') condition?: string,
    @Body('remarks') remarks?: string,
  ) {
    return this.libraryService.updateCopyStatus(id, status, condition, remarks);
  }

  // ── Membership ────────────────────────────────────────────────────────────
  @Get('members')
  @RequirePermission('LIBRARY', 'VIEW')
  @ApiOperation({ summary: 'List Library Members' })
  @ApiQuery({ name: 'memberType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  getMembers(
    @Query('memberType') memberType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.libraryService.getMembers({ memberType, status, search });
  }

  @Get('members/me')
  @ApiOperation({ summary: 'Get current user membership profile' })
  getMyMembership(@Req() req: any) {
    return this.libraryService.getOrCreateMembership(req.user.id);
  }

  @Post('members/sync/:userId')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Provision or Sync Library Membership for User' })
  syncMembership(@Param('userId') userId: string) {
    return this.libraryService.getOrCreateMembership(userId);
  }

  // ── OPAC Search ───────────────────────────────────────────────────────────
  @Get('search')
  @ApiOperation({ summary: 'Unified OPAC Book & Digital Resource Search' })
  search(@Query() query: any) {
    return this.libraryService.getBooks(query);
  }

  // ── Circulation (Issue / Return / Renewal) ────────────────────────────────
  @Post('issues')
  @RequirePermission('LIBRARY', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue Book Copy to Member' })
  issueBook(@Body() body: any, @Req() req: any) {
    return this.libraryService.issueBook({
      ...body,
      issuedByUserId: req.user?.id,
    });
  }

  @Post('returns')
  @RequirePermission('LIBRARY', 'EDIT')
  @ApiOperation({ summary: 'Process Book Return & Calculate Overdue Fine' })
  returnBook(@Body() body: any, @Req() req: any) {
    return this.libraryService.returnBook({
      ...body,
      receivedByUserId: req.user?.id,
    });
  }

  @Post('issues/:id/renew')
  @ApiOperation({ summary: 'Renew Issued Book Copy' })
  renewBook(@Param('id') id: string, @Req() req: any) {
    return this.libraryService.renewBook(id, req.user?.id);
  }

  // ── Reservations ──────────────────────────────────────────────────────────
  @Post('reservations')
  @ApiOperation({ summary: 'Reserve an Unavailable Book Title' })
  reserveBook(@Body('bookId') bookId: string, @Req() req: any) {
    return this.libraryService.reserveBook(bookId, req.user.id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'List Book Reservations' })
  @ApiQuery({ name: 'bookId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  getReservations(
    @Req() req: any,
    @Query('bookId') bookId?: string,
    @Query('status') status?: string,
    @Query('my') my?: string,
  ) {
    return this.libraryService.getReservations({
      bookId,
      status,
      userId: my === 'true' ? req.user.id : undefined,
    });
  }

  @Patch('reservations/:id/cancel')
  @ApiOperation({ summary: 'Cancel Book Reservation' })
  cancelReservation(@Param('id') id: string, @Req() req: any) {
    return this.libraryService.cancelReservation(id, req.user.id);
  }

  // ── Overdue & Fines ───────────────────────────────────────────────────────
  @Get('overdue')
  @RequirePermission('LIBRARY', 'VIEW')
  @ApiOperation({ summary: 'List All Overdue Book Issues with Calculated Fines' })
  getOverdueIssues() {
    return this.libraryService.getOverdueIssues();
  }

  @Get('fines')
  @ApiOperation({ summary: 'List Library Fines' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'my', required: false })
  getFines(@Req() req: any, @Query('status') status?: string, @Query('my') my?: string) {
    return this.libraryService.getFines({
      status,
      userId: my === 'true' ? req.user.id : undefined,
    });
  }

  @Post('fines/:id/pay')
  @RequirePermission('LIBRARY', 'EDIT')
  @ApiOperation({ summary: 'Record Fine Payment in Central Finance Ledger' })
  recordFinePayment(
    @Param('id') id: string,
    @Body('transactionRef') transactionRef: string,
    @Body('remarks') remarks?: string,
  ) {
    return this.libraryService.recordFinePayment(id, { transactionRef, remarks });
  }

  @Patch('fines/:id/waive')
  @RequirePermission('LIBRARY', 'APPROVE')
  @ApiOperation({ summary: 'Waive Library Fine with Justification' })
  waiveFine(@Param('id') id: string, @Body('remarks') remarks: string) {
    return this.libraryService.waiveFine(id, remarks);
  }

  // ── Lost / Damaged Book Incidents ─────────────────────────────────────────
  @Post('incidents')
  @ApiOperation({ summary: 'Report Lost or Damaged Book Incident' })
  reportIncident(@Body() body: any, @Req() req: any) {
    return this.libraryService.reportIncident({
      ...body,
      userId: body.userId || req.user.id,
    });
  }

  @Get('incidents')
  @RequirePermission('LIBRARY', 'VIEW')
  @ApiOperation({ summary: 'List Library Incidents' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'incidentType', required: false })
  getIncidents(@Query('status') status?: string, @Query('incidentType') incidentType?: string) {
    return this.libraryService.getIncidents({ status, incidentType });
  }

  @Patch('incidents/:id/resolve')
  @RequirePermission('LIBRARY', 'APPROVE')
  @ApiOperation({ summary: 'Resolve Incident and Post Charge to Finance' })
  resolveIncident(
    @Param('id') id: string,
    @Body('chargeFine') chargeFine: boolean,
    @Body('resolutionRemarks') resolutionRemarks: string,
  ) {
    return this.libraryService.resolveIncident(id, { chargeFine, resolutionRemarks });
  }

  // ── No-Dues Clearance ─────────────────────────────────────────────────────
  @Get('no-dues/:userId')
  @ApiOperation({ summary: 'Check User Library Clearance (Outstanding Books & Fines)' })
  checkNoDues(@Param('userId') userId: string) {
    return this.libraryService.checkNoDues(userId);
  }

  @Get('no-dues-me')
  @ApiOperation({ summary: 'Check Current User Library Clearance' })
  checkMyNoDues(@Req() req: any) {
    return this.libraryService.checkNoDues(req.user.id);
  }

  // ── Digital Library & Course Resources ────────────────────────────────────
  @Post('digital')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Upload / Register Digital Resource' })
  createDigitalResource(@Body() body: any) {
    return this.libraryService.createDigitalResource(body);
  }

  @Get('digital')
  @ApiOperation({ summary: 'List Digital Learning Resources' })
  @ApiQuery({ name: 'programId', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  @ApiQuery({ name: 'search', required: false })
  getDigitalResources(
    @Req() req: any,
    @Query('programId') programId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('resourceType') resourceType?: string,
    @Query('search') search?: string,
  ) {
    return this.libraryService.getDigitalResources({
      programId,
      subjectId,
      resourceType,
      search,
      userRole: req.user?.role,
    });
  }

  @Post('digital/:id/download')
  @ApiOperation({ summary: 'Track Digital Resource Download' })
  incrementDownload(@Param('id') id: string) {
    return this.libraryService.incrementDigitalDownload(id);
  }

  // ── Notices ───────────────────────────────────────────────────────────────
  @Get('notices')
  @ApiOperation({ summary: 'List Active Library Notices & Circulars' })
  @ApiQuery({ name: 'audience', required: false })
  getNotices(@Query('audience') audience?: string) {
    return this.libraryService.getNotices(audience);
  }

  @Post('notices')
  @RequirePermission('LIBRARY', 'CREATE')
  @ApiOperation({ summary: 'Create Library Notice' })
  createNotice(@Body() body: any) {
    return this.libraryService.createNotice(body);
  }

  // ── Policies ──────────────────────────────────────────────────────────────
  @Get('policies')
  @ApiOperation({ summary: 'List Library Circulation & Fine Policies' })
  getPolicies() {
    return this.libraryService.getPolicies();
  }

  @Post('policies')
  @RequirePermission('LIBRARY', 'EDIT')
  @ApiOperation({ summary: 'Configure Library Policy' })
  createOrUpdatePolicy(@Body() body: any) {
    return this.libraryService.createOrUpdatePolicy(body);
  }

  // ── Reports ───────────────────────────────────────────────────────────────
  @Get('reports/:type')
  @RequirePermission('LIBRARY', 'VIEW')
  @ApiOperation({ summary: 'Get Library Analytical Reports' })
  getReports(@Param('type') type: string) {
    return this.libraryService.getReports(type.toUpperCase());
  }
}
