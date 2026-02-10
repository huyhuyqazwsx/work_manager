import { ApiProperty } from '@nestjs/swagger';

export class ImportInviteDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Excel file (.xlsx)',
  })
  file: any;
}
