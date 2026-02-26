import { Module } from '@nestjs/common';
import { OtService } from './application/services/ot.service';
import { OtController } from './presentation/controllers/ot.controller';

@Module({
  providers: [OtService],
  controllers: [OtController],
})
export class OtModule {}
