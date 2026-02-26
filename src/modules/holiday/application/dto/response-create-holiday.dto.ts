import { ApiProperty } from '@nestjs/swagger';

export class CreateHolidayResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  holiday: {
    id: string;
    name: string;
    date: string;
    needsCompensation: boolean;
  };

  @ApiProperty({ required: false })
  compensatory?: {
    id: string;
    name: string;
    date: string;
  };
}
