import { Module } from '@nestjs/common';
import { DepartmentService } from './application/services/department.service';
import { DepartmentController } from './presentation/controllers/department.controller';
import { PrismaDepartmentRepository } from './infrastructure/Repository/department.repository';

@Module({
  providers: [
    {
      provide: 'IDepartmentService',
      useClass: DepartmentService,
    },
    {
      provide: 'IDepartmentRepository',
      useClass: PrismaDepartmentRepository,
    },
  ],
  controllers: [DepartmentController],
  exports: ['IDepartmentRepository'],
})
export class DepartmentModule {}
