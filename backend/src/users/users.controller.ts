import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: '创建用户（仅管理员）' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles('admin', 'interviewer')
  @ApiOperation({ summary: '获取所有用户' })
  @ApiQuery({
    name: 'role',
    required: false,
    description: '按角色筛选用户（例如：interviewer, candidate, admin）',
  })
  findAll(@Query('role') role?: string) {
    return this.usersService.findAll(role);
  }

  @Get('roles')
  @ApiOperation({ summary: '获取所有角色' })
  getRoles() {
    return this.usersService.getRoles();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新用户信息' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: '删除用户（仅管理员）' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}

