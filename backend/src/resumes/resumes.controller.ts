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
  UploadedFiles,
  Res,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
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
  @ApiOperation({ 
    summary: '上传简历文件（支持多简历检测）',
    description: '上传简历文件，可选启用多简历检测。启用后，如果文件包含多个简历，将自动拆分并创建多条记录。'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '简历文件（支持PDF、TXT、DOCX）',
        },
        jobId: {
          type: 'number',
          description: '关联岗位ID（可选）',
        },
        detectMultiple: {
          type: 'boolean',
          description: '是否启用多简历检测（默认false）',
          default: false,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: '上传成功。如果检测到多个简历，会返回第一个简历的信息，其他简历在后台创建',
    type: Resume 
  })
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
    @Body('detectMultiple') detectMultiple: string,
    @CurrentUser() user: any,
  ) {
    const jobIdNum = jobId ? parseInt(jobId) : undefined;
    const enableDetection = detectMultiple === 'true' || detectMultiple === '1';
    return this.resumesService.uploadResume(file, jobIdNum, user.userId, enableDetection);
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
    @CurrentUser() user: any,
  ) {
    return this.resumesService.update(id, updateResumeDto, user.userId);
  }

  @Patch(':id/link-job/:jobId')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '关联简历到岗位' })
  @ApiResponse({ status: 200, description: '关联成功', type: Resume })
  linkToJob(
    @Param('id', ParseIntPipe) id: number,
    @Param('jobId', ParseIntPipe) jobId: number,
    @CurrentUser() user: any,
  ) {
    return this.resumesService.linkToJob(id, jobId, user.userId);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除简历' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '简历不存在' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    await this.resumesService.remove(id, user.userId);
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

  @Post('batch-upload')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '批量上传简历（最多100份）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        jobId: {
          type: 'number',
          description: '关联岗位ID（可选）',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: '批量上传完成' })
  @UseInterceptors(
    FilesInterceptor('files', 100, {
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
  async batchUpload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('jobId') jobId: string,
    @CurrentUser() user: any,
  ) {
    const jobIdNum = jobId ? parseInt(jobId) : undefined;
    return this.resumesService.batchUploadResumes(files, jobIdNum, user.userId);
  }

  @Post(':id/reparse')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '重新解析简历' })
  @ApiResponse({ status: 200, description: '重新解析已开始', type: Resume })
  @ApiResponse({ status: 404, description: '简历不存在或无原始文件' })
  async reparseResume(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.resumesService.reparseResume(id, user.userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: '下载原始简历文件' })
  @ApiResponse({ status: 200, description: '下载成功' })
  @ApiResponse({ status: 404, description: '文件不存在' })
  async downloadResume(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
    @CurrentUser() user: any,
  ) {
    const { filePath, fileName } = await this.resumesService.getResumeFile(
      id,
      user.userId,
    );
    res.download(filePath, fileName);
  }

  @Get(':id/history')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '获取简历操作历史' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '限制数量',
    example: 50,
  })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getResumeHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query('limit') limit?: string,
  ) {
    const auditService = this.resumesService['auditService'];
    return auditService.getResumeHistory(id, limit ? parseInt(limit) : 50);
  }

  @Get('import-report/me')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '获取我的导入报告' })
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
  getImportReport(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.resumesService.getImportReport(
      user.userId,
      startDate,
      endDate,
    );
  }
}

