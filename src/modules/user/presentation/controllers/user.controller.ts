import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import * as userServiceInterface from '../../application/interfaces/user.service.interface';
import { UserAuth } from '../../../../domain/entities/userAuth.entity';
import { InviteUsersDto } from '../../application/dto/invite-users.dto';
import { ResendInviteDto } from '../../application/dto/resend-invite.dto';
import { VerifyEmailDto } from '../../application/dto/verify-email.dtto';

@Controller('user')
export class UserController {
  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  @Get()
  async findAll(): Promise<UserAuth[]> {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserAuth | null> {
    return this.userService.findUserById(id);
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<UserAuth | null> {
    return this.userService.findUserByEmail(email);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() user: Partial<UserAuth>,
  ): Promise<{ success: boolean }> {
    await this.userService.updateUser(id, user);
    return {
      success: true,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.userService.deleteUser(id);
  }

  @Post('invite')
  async inviteUsers(@Body() dto: InviteUsersDto) {
    const result = await this.userService.inviteUsers(dto.emails);

    return {
      success: true,
      data: result,
    };
  }

  @Post('resend-invite')
  async resendInvite(@Body() dto: ResendInviteDto) {
    await this.userService.resendInvite(dto.email);

    return {
      success: true,
      message: `Invite email resent to ${dto.email}`,
    };
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.userService.verifyEmail(dto.email, dto.token);

    return {
      success: true,
      message: 'Email verified successfully',
    };
  }
}
