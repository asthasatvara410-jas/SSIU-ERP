import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Global Unified Search')
@ApiBearerAuth()
@Controller('api/v1/search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Global search across authorized ERP entities' })
  @ApiQuery({ name: 'q', required: true, description: 'Search term (min 2 chars)' })
  globalSearch(@Query('q') q: string) {
    return this.searchService.globalSearch(q);
  }
}
