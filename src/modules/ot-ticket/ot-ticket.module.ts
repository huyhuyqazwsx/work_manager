import { Module } from '@nestjs/common';
import { CompensationModule } from '../compensation/compensation.module';
import { PrismaOTTicketRepository } from '@modules/ot-ticket/infrastructure/ot-ticket.repository';
import { OTTicketService } from '@modules/ot-ticket/application/services/ot-ticket.service';
import { OTTicketController } from '@modules/ot-ticket/presentation/controllers/ot-ticket.controller';
import { OTTicketCronJob } from '@modules/ot-ticket/application/worker/ot-ticket.worker';

@Module({
  imports: [CompensationModule],
  controllers: [OTTicketController],
  providers: [
    {
      provide: 'IOTTicketRepository',
      useClass: PrismaOTTicketRepository,
    },
    {
      provide: 'IOTTicketService',
      useClass: OTTicketService,
    },
    OTTicketCronJob,
  ],
  exports: ['IOTTicketService'],
})
export class OTTicketModule {}
