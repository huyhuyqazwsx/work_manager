import { OtTypeController } from './presentation/controllers/ot-type.controller';
import { Module } from '@nestjs/common';
import { OtTypeService } from './application/services/ot-type.service';

@Module({
  providers: [OtTypeService],
  controllers: [OtTypeController],
})
export class OtTypeModule {}
