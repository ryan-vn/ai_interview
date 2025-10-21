import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号，默认角色为候选人' })
  @ApiResponse({ status: 201, description: '注册成功，返回用户信息（不含密码）' })
  @ApiResponse({ status: 401, description: '用户名或邮箱已存在' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录，返回 JWT token' })
  @ApiResponse({
    status: 200,
    description: '登录成功，返回 access_token 和用户信息',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'john_doe',
          email: 'john@example.com',
          role: { id: 1, name: 'candidate' },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: '用户名或密码错误' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '返回用户信息' })
  @ApiUnauthorizedResponse({ description: '未登录或 token 无效' })
  getProfile(@Request() req) {
    return this.authService.getProfile(req.user.userId);
  }
}

