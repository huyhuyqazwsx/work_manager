import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import * as otTicketServiceInterface from '@modules/ot-ticket/application/interfaces/ot-ticket.service.interface';
import { RolesGuard } from '@modules/jwt/guards/roles.guard';
import { AccessTokenGuard } from '@modules/jwt/guards/access-token.guard';
import { Roles } from '@modules/jwt/decorators/roles.decorator';
import { UserRole } from '@domain/enum/enum';
import { CurrentUser } from '@modules/jwt/decorators/current-user.decorator';
import * as requestTypes from '@domain/type/request.types';
import * as requestTypes_1 from '@domain/type/request.types';
import { CheckInOtTicketDto } from '@modules/ot-ticket/application/dto/check-in-ticket.dto';

@ApiTags('OT Ticket')
@Controller('ot-ticket')
@UseGuards(AccessTokenGuard, RolesGuard)
export class OTTicketController {
  constructor(
    @Inject('IOTTicketService')
    private readonly otTicketService: otTicketServiceInterface.IOTTicketService,
  ) {}

  @Get('plan/:planId')
  @ApiOperation({ summary: 'Get tickets by plan' })
  @ApiParam({ name: 'planId', type: String })
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD)
  getTicketsByPlan(@Param('planId') planId: string) {
    return this.otTicketService.getTicketsByPlan(planId);
  }

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get my tickets' })
  getMyTickets(@CurrentUser() user: requestTypes_1.RequestUser) {
    return this.otTicketService.getMyTickets(user.userId);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: 'Check in OT ticket' })
  @ApiParam({ name: 'id', type: String })
  @Roles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD)
  checkIn(
    @Param('id') id: string,
    @CurrentUser() user: requestTypes.RequestUser,
    @Body() dto: CheckInOtTicketDto,
  ) {
    return this.otTicketService.checkIn(
      id,
      user.userId,
      dto.workPlan,
      dto.otType,
    );
  }

  @Patch(':id/check-out')
  @ApiOperation({ summary: 'Check out OT ticket' })
  @ApiParam({ name: 'id', type: String })
  @Roles(UserRole.EMPLOYEE, UserRole.DEPARTMENT_HEAD)
  checkOut(
    @Param('id') id: string,
    @CurrentUser() user: requestTypes.RequestUser,
    @Body('result') result: string,
  ) {
    return this.otTicketService.checkOut(id, user.userId, result);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Manager verifies completed ticket' })
  @ApiParam({ name: 'id', type: String })
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD)
  verify(
    @Param('id') id: string,
    @CurrentUser() user: requestTypes.RequestUser,
  ) {
    return this.otTicketService.verify(id, user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Manager rejects completed ticket' })
  @ApiParam({ name: 'id', type: String })
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD)
  reject(@Param('id') id: string, @Body('note') note: string) {
    return this.otTicketService.reject(id, note);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel scheduled ticket' })
  @ApiParam({ name: 'id', type: String })
  @Roles(UserRole.DEPARTMENT_HEAD, UserRole.HR, UserRole.BOD)
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: requestTypes.RequestUser,
  ) {
    return this.otTicketService.cancel(id, user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  // Mọi role đều xem được, guard tự kiểm tra ownership ở service layer
  getTicketById(@Param('id') id: string) {
    return this.otTicketService.getTicketById(id);
  }
}
