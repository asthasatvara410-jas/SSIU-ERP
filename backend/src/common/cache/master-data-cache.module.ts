import { Module, Global } from '@nestjs/common';
import { MasterDataCacheService } from './master-data-cache.service';

@Global()
@Module({
  providers: [MasterDataCacheService],
  exports: [MasterDataCacheService],
})
export class MasterDataCacheModule {}
