import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { CreateItemCategoryDto, CreateUnitDto, CreateItemDto, StockInDto, CreateStockAdjustmentDto, CreateStockIssueDto, CreateStockReturnDto } from './dto/store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../rbac/rbac.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';

@ApiTags('Central Store Management')
@ApiBearerAuth()
@Controller('api/v1/store')
@UseGuards(JwtAuthGuard, RbacGuard)
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  // ── Categories
  @Post('categories')
  @RequirePermission('STORE', 'CREATE')
  @ApiOperation({ summary: 'Create Item Category' })
  createCategory(@Body() dto: CreateItemCategoryDto) {
    return this.storeService.createCategory(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all Item Categories (with hierarchy)' })
  getCategories() {
    return this.storeService.getCategories();
  }

  // ── Units of Measurement
  @Post('units')
  @RequirePermission('STORE', 'CREATE')
  @ApiOperation({ summary: 'Create Unit of Measurement (NOS, KG, LTR, etc.)' })
  createUnit(@Body() dto: CreateUnitDto) {
    return this.storeService.createUnit(dto);
  }

  @Get('units')
  @ApiOperation({ summary: 'List all Units of Measurement' })
  getUnits() {
    return this.storeService.getUnits();
  }

  // ── Item Master
  @Post('items')
  @RequirePermission('STORE', 'CREATE')
  @ApiOperation({ summary: 'Create new store item' })
  createItem(@Body() dto: CreateItemDto) {
    return this.storeService.createItem(dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'List store items' })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'search', required: false })
  getItems(@Query('categoryId') categoryId?: string, @Query('search') search?: string) {
    return this.storeService.getItems(categoryId, search);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get item detail with stock ledger' })
  getItemById(@Param('id') id: string) {
    return this.storeService.getItemById(id);
  }

  // ── Stock In
  @Post('stock-in')
  @RequirePermission('STORE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record stock receipt (Stock In)' })
  stockIn(@Body() dto: StockInDto, @Req() req: any) {
    return this.storeService.stockIn(dto, req.user.id);
  }

  // ── Stock Adjustments
  @Post('adjustments')
  @RequirePermission('STORE', 'EDIT')
  @ApiOperation({ summary: 'Create stock adjustment (damage, loss, correction)' })
  createAdjustment(@Body() dto: CreateStockAdjustmentDto, @Req() req: any) {
    return this.storeService.createAdjustment(dto, req.user.id);
  }

  @Get('adjustments')
  @RequirePermission('STORE', 'VIEW')
  @ApiOperation({ summary: 'List stock adjustments' })
  @ApiQuery({ name: 'itemId', required: false })
  getAdjustments(@Query('itemId') itemId?: string) {
    return this.storeService.getAdjustments(itemId);
  }

  // ── Stock Issues
  @Post('issues')
  @RequirePermission('STORE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue stock to user or department' })
  issueStock(@Body() dto: CreateStockIssueDto, @Req() req: any) {
    return this.storeService.issueStock(dto, req.user.id);
  }

  @Get('issues')
  @ApiOperation({ summary: 'List stock issues' })
  @ApiQuery({ name: 'itemId', required: false })
  @ApiQuery({ name: 'status', required: false })
  getIssues(@Query('itemId') itemId?: string, @Query('status') status?: string) {
    return this.storeService.getIssues(itemId, status);
  }

  // ── Stock Returns
  @Post('returns')
  @RequirePermission('STORE', 'CREATE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record stock return from user/department' })
  returnStock(@Body() dto: CreateStockReturnDto, @Req() req: any) {
    return this.storeService.returnStock(dto, req.user.id);
  }

  // ── Reports
  @Get('current-stock')
  @ApiOperation({ summary: 'Get current stock levels for all items' })
  @ApiQuery({ name: 'categoryId', required: false })
  getCurrentStock(@Query('categoryId') categoryId?: string) {
    return this.storeService.getCurrentStock(categoryId);
  }

  @Get('low-stock-alerts')
  @ApiOperation({ summary: 'Get items below reorder level (low stock alerts)' })
  getLowStockAlerts() {
    return this.storeService.getLowStockAlerts();
  }

  @Get('ledger/:itemId')
  @RequirePermission('STORE', 'VIEW')
  @ApiOperation({ summary: 'Get complete stock ledger for an item' })
  getStockLedger(@Param('itemId') itemId: string) {
    return this.storeService.getStockLedger(itemId);
  }
}
