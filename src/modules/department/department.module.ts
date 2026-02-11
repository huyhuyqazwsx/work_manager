import { Module } from '@nestjs/common';
import { DepartmentService } from './application/services/department.service';
import { DepartmentController } from './presentation/controllers/department.controller';
import { PrismaDepartmentRepository } from './infrastructure/Repository/department.repository';

@Module({
  providers: [
    {
      provide: 'IDepartmentService',
      useValue: DepartmentService,
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
