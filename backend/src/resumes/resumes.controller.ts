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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ResumesService } from './resumes.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { Resume } from './entities/resume.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('简历管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '创建简历（手动录入）' })
  @ApiResponse({ status: 201, description: '创建成功', type: Resume })
  @ApiResponse({ status: 409, description: '手机号已存在' })
  create(@Body() createResumeDto: CreateResumeDto, @CurrentUser() user: any) {
    return this.resumesService.create(createResumeDto, user.userId);
  }

  @Post('upload')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '上传简历文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        jobId: {
          type: 'number',
          description: '关联岗位ID（可选）',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '上传成功', type: Resume })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/resumes',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    const jobIdNum = jobId ? parseInt(jobId) : undefined;
    return this.resumesService.uploadResume(file, jobIdNum, user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取简历列表' })
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
    description: '简历状态',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    description: '关联岗位ID',
  })
  @ApiQuery({
    name: 'keyword',
    required: false,
    description: '搜索关键词（姓名、手机、邮箱）',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: '开始日期',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: '结束日期',
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('jobId') jobId?: string,
    @Query('keyword') keyword?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.resumesService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      jobId ? parseInt(jobId) : undefined,
      keyword,
      startDate,
      endDate,
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取简历统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStatistics() {
    return this.resumesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取简历详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: Resume })
  @ApiResponse({ status: 404, description: '简历不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.resumesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '更新简历' })
  @ApiResponse({ status: 200, description: '更新成功', type: Resume })
  @ApiResponse({ status: 404, description: '简历不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResumeDto: UpdateResumeDto,
  ) {
    return this.resumesService.update(id, updateResumeDto);
  }

  @Patch(':id/link-job/:jobId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '关联简历到岗位' })
  @ApiResponse({ status: 200, description: '关联成功', type: Resume })
  linkToJob(
    @Param('id', ParseIntPipe) id: number,
    @Param('jobId', ParseIntPipe) jobId: number,
  ) {
    return this.resumesService.linkToJob(id, jobId);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.resumesService.remove(id);
    return { message: '删除成功' };
  }

  @Post('batch-delete')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async batchRemove(@Body('ids') ids: number[]) {
    await this.resumesService.batchRemove(ids);
    return { message: '批量删除成功' };
  }
}

