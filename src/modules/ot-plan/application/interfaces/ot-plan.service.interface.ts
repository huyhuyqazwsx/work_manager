import { OTPlan } from '@domain/entities/ot-plan.entity';
import { IBaseCrudService } from '@domain/crudservice/base-crud.service.interface';
import { CreateOTPlanDto } from '@modules/ot-plan/application/dto/create-ot-plan.dto';
import { UpdateOTPlanDto } from '@modules/ot-plan/application/dto/update-ot-plan.dto';
import { PreviewOTPlanResponseDto } from '@modules/ot-plan/application/dto/preview-ot-plan.dto';

export interface IOTPlanService extends IBaseCrudService<OTPlan> {
  getPlanById(planId: string): Promise<OTPlan>;
  getMyPlans(
    managerId: string,
    page: number,
    limit: number,
    status?: string,
    fromDate?: string,
    toDate?: string,
    search?: string,
  ): Promise<{
    data: OTPlan[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  getPendingPlans(): Promise<OTPlan[]>;
  createPlan(dto: CreateOTPlanDto): Promise<OTPlan>;
  updatePlan(planId: string, dto: UpdateOTPlanDto): Promise<OTPlan>;
  submitPlan(planId: string, managerId: string): Promise<OTPlan>;
  approvePlan(planId: string, approvedBy: string): Promise<OTPlan>;
  rejectPlan(planId: string, rejectedBy: string, note: string): Promise<OTPlan>;
  revisePlan(planId: string, managerId: string): Promise<OTPlan>;
  cancelPlan(planId: string, managerId: string): Promise<void>;
  deletePlan(planId: string, managerId: string): Promise<void>;
  previewPlan(dto: CreateOTPlanDto): Promise<PreviewOTPlanResponseDto>;
}
