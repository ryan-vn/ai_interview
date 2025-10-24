import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Job } from './entities/job.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('岗位管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '创建岗位' })
  @ApiResponse({ status: 201, description: '创建成功', type: Job })
  @ApiResponse({ status: 409, description: '同部门已存在同名岗位' })
  create(@Body() createJobDto: CreateJobDto, @CurrentUser() user: any) {
    return this.jobsService.create(createJobDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取岗位列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '每页数量',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '岗位状态',
    enum: ['open', 'closed'],
  })
  @ApiQuery({
    name: 'department',
    required: false,
    description: '部门',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '搜索关键词',
  })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('department') department?: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.jobsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      department,
      keyword,
    );
  }

  @Get('departments')
  @ApiOperation({ summary: '获取所有部门列表' })
  @ApiResponse({ status: 200, description: '获取成功', type: [String] })
  getDepartments() {
    return this.jobsService.getDepartments();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取岗位详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Job })
  @ApiResponse({ status: 404, description: '岗位不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '更新岗位' })
  @ApiResponse({ status: 200, description: '更新成功', type: Job })
  @ApiResponse({ status: 404, description: '岗位不存在' })
  @ApiResponse({ status: 409, description: '同部门已存在同名岗位' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.update(id, updateJobDto, user.userId);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除岗位' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '岗位不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.jobsService.remove(id);
    return { message: '删除成功' };
  }

  @Post('batch-delete')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量删除岗位' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchRemove(@Body('ids') ids: number[]) {
    await this.jobsService.batchRemove(ids);
    return { message: '批量删除成功' };
  }
}

