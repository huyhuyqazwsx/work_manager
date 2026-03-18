import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Patch,
  Inject,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import * as otPlanServiceInterface from '@modules/ot-plan/application/interfaces/ot-plan.service.interface';
import { CreateOTPlanDto } from '@modules/ot-plan/application/dto/create-ot-plan.dto';
import { UpdateOTPlanDto } from '@modules/ot-plan/application/dto/update-ot-plan.dto';
import { PreviewOTPlanResponseDto } from '@modules/ot-plan/application/dto/preview-ot-plan.dto';

@ApiTags('OT Plan')
@Controller('ot-plan')
export class OTPlanController {
  constructor(
    @Inject('IOTPlanService')
    private readonly otPlanService: otPlanServiceInterface.IOTPlanService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get plan by ID' })
  @ApiParam({ name: 'id', type: String })
  getPlanById(@Param('id') id: string) {
    return this.otPlanService.getPlanById(id);
  }

  @Get('manager/:managerId')
  getMyPlans(
    @Param('managerId') managerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('search') search?: string,
  ) {
    return this.otPlanService.getMyPlans(
      managerId,
      Number(page),
      Number(limit),
      status,
      fromDate,
      toDate,
      search,
    );
  }

  @Get('pending/all')
  @ApiOperation({ summary: 'Get all pending plans' })
  getPendingPlans() {
    return this.otPlanService.getPendingPlans();
  }

  @Post()
  @ApiOperation({ summary: 'Create OT plan' })
  createPlan(@Body() dto: CreateOTPlanDto) {
    return this.otPlanService.createPlan(dto);
  }

  @Post('preview')
  async previewPlan(
    @Body() dto: CreateOTPlanDto,
  ): Promise<PreviewOTPlanResponseDto> {
    return this.otPlanService.previewPlan(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update OT plan (Draft only)' })
  @ApiParam({ name: 'id', type: String })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateOTPlanDto) {
    return this.otPlanService.updatePlan(id, dto);
  }

  @Patch(':id/submit')
  @ApiOperation({ summary: 'Submit plan to BOD' })
  @ApiParam({ name: 'id', type: String })
  submitPlan(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otPlanService.submitPlan(id, managerId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'BOD approves plan' })
  @ApiParam({ name: 'id', type: String })
  approvePlan(@Param('id') id: string, @Body('approvedBy') approvedBy: string) {
    return this.otPlanService.approvePlan(id, approvedBy);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'BOD rejects plan' })
  @ApiParam({ name: 'id', type: String })
  rejectPlan(
    @Param('id') id: string,
    @Body('rejectedBy') rejectedBy: string,
    @Body('note') note: string,
  ) {
    return this.otPlanService.rejectPlan(id, rejectedBy, note);
  }

  @Patch(':id/revise')
  @ApiOperation({ summary: 'Manager revises rejected plan back to Draft' })
  @ApiParam({ name: 'id', type: String })
  revisePlan(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otPlanService.revisePlan(id, managerId);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel approved plan' })
  @ApiParam({ name: 'id', type: String })
  cancelPlan(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otPlanService.cancelPlan(id, managerId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete draft plan' })
  @ApiParam({ name: 'id', type: String })
  deletePlan(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otPlanService.deletePlan(id, managerId);
  }
}
