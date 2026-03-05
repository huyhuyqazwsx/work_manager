import { Body, Controller, Get, Param, Patch, Inject } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import * as otTicketServiceInterface from '@modules/ot-ticket/application/interfaces/ot-ticket.service.interface';

@ApiTags('OT Ticket')
@Controller('ot-ticket')
export class OTTicketController {
  constructor(
    @Inject('IOTTicketService')
    private readonly otTicketService: otTicketServiceInterface.IOTTicketService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiParam({ name: 'id', type: String })
  getTicketById(@Param('id') id: string) {
    return this.otTicketService.getTicketById(id);
  }

  @Get('plan/:planId')
  @ApiOperation({ summary: 'Get tickets by plan' })
  @ApiParam({ name: 'planId', type: String })
  getTicketsByPlan(@Param('planId') planId: string) {
    return this.otTicketService.getTicketsByPlan(planId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get my tickets' })
  @ApiParam({ name: 'userId', type: String })
  getMyTickets(@Param('userId') userId: string) {
    return this.otTicketService.getMyTickets(userId);
  }

  @Patch(':id/check-in')
  @ApiOperation({ summary: 'Check in OT ticket' })
  @ApiParam({ name: 'id', type: String })
  checkIn(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('plan') plan: string,
  ) {
    return this.otTicketService.checkIn(id, userId, plan);
  }

  @Patch(':id/check-out')
  @ApiOperation({ summary: 'Check out OT ticket' })
  @ApiParam({ name: 'id', type: String })
  checkOut(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('result') result: string,
  ) {
    return this.otTicketService.checkOut(id, userId, result);
  }

  @Patch(':id/verify')
  @ApiOperation({ summary: 'Manager verifies completed ticket' })
  @ApiParam({ name: 'id', type: String })
  verify(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otTicketService.verify(id, managerId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Manager rejects completed ticket' })
  @ApiParam({ name: 'id', type: String })
  reject(@Param('id') id: string, @Body('note') note: string) {
    return this.otTicketService.reject(id, note);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel scheduled ticket' })
  @ApiParam({ name: 'id', type: String })
  cancel(@Param('id') id: string, @Body('managerId') managerId: string) {
    return this.otTicketService.cancel(id, managerId);
  }
}
