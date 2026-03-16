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
  Req,
  UseGuards,
} from '@nestjs/common';
import * as userServiceInterface from '../../application/interfaces/user.service.interface';
import { UserAuth } from '@domain/entities/userAuth.entity';
import { ResendInviteDto } from '../../application/dto/resend-invite.dto';
import { VerifyEmailDto } from '../../application/dto/verify-email.dtto';
import { AccessTokenGuard } from '../../../jwt/guards/access-token.guard';
import { UserResponseDto } from '@modules/user/application/dto/user-response.dto';
import { UserInDepartmentDto } from '@modules/user/application/dto/user-in-department.dto';
import { ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('user')
export class UserController {
  constructor(
    @Inject('IUserService')
    private readonly userService: userServiceInterface.IUserService,
  ) {}

  @Get('profile')
  @UseGuards(AccessTokenGuard)
  async getProfile(
    @Req() req: Request & { user: { userId: string; role: string } },
  ) {
    return this.userService.getProfile(req.user.userId);
  }

  @Get('department/:managerId/users')
  @ApiOperation({ summary: 'Get users in manager department' })
  @ApiParam({
    name: 'managerId',
    type: String,
    description: 'Manager ID',
  })
  getUsersByUserOfDepartment(
    @Param('managerId') managerId: string,
  ): Promise<UserInDepartmentDto[]> {
    return this.userService.getUsersByUserOfDepartment(managerId);
  }

  @Get()
  async findAll(): Promise<UserResponseDto[]> {
    return this.userService.findAllUsers();
  }

  @Get('email/:email')
  async findByEmail(@Param('email') email: string): Promise<UserAuth | null> {
    return this.userService.findUserByEmail(email);
  }

  @Get('count')
  async getCountCode() {
    return await this.userService.getCountCode();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<UserAuth | null> {
    return this.userService.findUserById(id);
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

  @Post('resend-invite')
  resendInvite(@Body() dto: ResendInviteDto) {
    void this.userService.resendInvite(dto.email);

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
