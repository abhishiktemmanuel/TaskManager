import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { GenerateTokenDto, RevokeTokenDto } from './dto/token-operations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/interfaces/user-role.enum';

interface RequestWithUser extends Request {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return {
      message: 'Profile updated successfully',
      user: req.user,
      updateProfileDto,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('team/generate-invite-token')
  async generateTeamInviteToken(
    @Request() req: RequestWithUser,
    @Body() generateTokenDto: GenerateTokenDto,
  ) {
    const token = await this.authService.generateTeamInviteToken(
      req.user.id,
      generateTokenDto.teamId,
      generateTokenDto.purpose,
    );
    const response = {
      message: 'Team invitation token generated successfully',
      token: token,
      expiresIn: '24 hours',
    };

    return response;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('team/invite-tokens')
  getTeamInviteTokens(@Request() req: RequestWithUser) {
    const tokens = this.authService.getAdminTokens(req.user.id);
    return {
      tokens,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('team/revoke-invite-token')
  revokeTeamInviteToken(
    @Request() req: RequestWithUser,
    @Body() revokeTokenDto: RevokeTokenDto,
  ) {
    const success = this.authService.revokeTeamInviteToken(
      revokeTokenDto.token,
      req.user.id,
    );

    if (success) {
      return {
        message: 'Team invitation token revoked successfully',
      };
    } else {
      return {
        message: 'Token not found or you do not have permission to revoke it',
      };
    }
  }
}
