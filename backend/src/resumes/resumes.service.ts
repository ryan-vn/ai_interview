import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume, ParseStatus } from './entities/resume.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { AiService } from '../ai/ai.service';
import { ResumeAuditService } from './resume-audit.service';
import { ResumeActionType } from './entities/resume-audit-log.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(Resume)
    private resumesRepository: Repository<Resume>,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    private auditService: ResumeAuditService,
  ) {}

  async create(createResumeDto: CreateResumeDto, userId: number): Promise<Resume> {
    // 检查手机号是否已存在
    const existingByPhone = await this.resumesRepository.findOne({
      where: { phone: createResumeDto.phone, isDeleted: false },
    });

    if (existingByPhone) {
      throw new ConflictException('该手机号已存在，请勿重复导入');
    }

    const resume = this.resumesRepository.create({
      ...createResumeDto,
      importedBy: userId,
      parseStatus: ParseStatus.SUCCESS,
    });

    const savedResume = await this.resumesRepository.save(resume);

    // 记录审计日志
    await this.auditService.log(
      savedResume.id,
      ResumeActionType.CREATE,
      userId,
      { name: savedResume.name, phone: savedResume.phone },
    );

    return savedResume;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    jobId?: number,
    keyword?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ data: Resume[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.resumesRepository
      .createQueryBuilder('resume')
      .leftJoinAndSelect('resume.job', 'job')
      .leftJoinAndSelect('resume.importer', 'importer')
      .where('resume.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      queryBuilder.andWhere('resume.status = :status', { status });
    }

    if (jobId) {
      queryBuilder.andWhere('resume.jobId = :jobId', { jobId });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(resume.name LIKE :keyword OR resume.phone LIKE :keyword OR resume.email LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (startDate) {
      queryBuilder.andWhere('resume.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('resume.createdAt <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('resume.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Resume> {
    const resume = await this.resumesRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['job', 'importer'],
    });

    if (!resume) {
      throw new NotFoundException(`简历 #${id} 不存在`);
    }

    return resume;
  }

  async update(
    id: number,
    updateResumeDto: UpdateResumeDto,
    userId?: number,
  ): Promise<Resume> {
    const resume = await this.findOne(id);

    // 如果修改了手机号，检查是否冲突
    if (updateResumeDto.phone && updateResumeDto.phone !== resume.phone) {
      const existingByPhone = await this.resumesRepository.findOne({
        where: { phone: updateResumeDto.phone, isDeleted: false },
      });

      if (existingByPhone) {
        throw new ConflictException('该手机号已存在');
      }
    }

    // 记录状态变化
    const statusChanged =
      updateResumeDto.status && updateResumeDto.status !== resume.status;

    Object.assign(resume, updateResumeDto);
    const savedResume = await this.resumesRepository.save(resume);

    // 记录审计日志
    if (userId) {
      await this.auditService.log(
        id,
        statusChanged ? ResumeActionType.STATUS_CHANGE : ResumeActionType.UPDATE,
        userId,
        updateResumeDto,
      );
    }

    return savedResume;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const resume = await this.findOne(id);

    // 软删除
    resume.isDeleted = true;
    await this.resumesRepository.save(resume);

    // 记录审计日志
    if (userId) {
      await this.auditService.log(
        id,
        ResumeActionType.DELETE,
        userId,
        { name: resume.name },
      );
    }
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  /**
   * 批量上传简历（最多100份）
   */
  async batchUploadResumes(
    files: Express.Multer.File[],
    jobId: number | undefined,
    userId: number,
  ): Promise<{
    success: Resume[];
    failed: Array<{ fileName: string; error: string }>;
    total: number;
  }> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请至少上传一个文件');
    }

    if (files.length > 100) {
      throw new BadRequestException('单次最多上传100份简历');
    }

    const success: Resume[] = [];
    const failed: Array<{ fileName: string; error: string }> = [];

    for (const file of files) {
      try {
        // 批量上传时不启用多简历检测
        const resume = await this.uploadResume(file, jobId, userId, false);
        // 如果是单个简历，添加到成功列表
        if (Array.isArray(resume)) {
          success.push(...resume);
        } else {
          success.push(resume);
        }
      } catch (error) {
        failed.push({
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      success,
      failed,
      total: files.length,
    };
  }

  /**
   * 重新解析简历
   */
  async reparseResume(id: number, userId?: number): Promise<Resume> {
    const resume = await this.findOne(id);

    if (!resume.filePath) {
      throw new BadRequestException('该简历没有原始文件，无法重新解析');
    }

    if (!fs.existsSync(resume.filePath)) {
      throw new BadRequestException('原始文件不存在');
    }

    // 重置解析状态
    resume.parseStatus = ParseStatus.PENDING;
    resume.parseError = null;
    await this.resumesRepository.save(resume);

    // 记录审计日志
    if (userId) {
      await this.auditService.log(
        id,
        ResumeActionType.REPARSE,
        userId,
        { fileName: resume.fileName },
      );
    }

    // 异步重新解析
    this.parseResumeAsync(resume.id, resume.filePath, userId);

    return resume;
  }

  /**
   * 下载原始简历文件
   */
  async getResumeFile(
    id: number,
    userId?: number,
  ): Promise<{ filePath: string; fileName: string }> {
    const resume = await this.findOne(id);

    if (!resume.filePath) {
      throw new NotFoundException('该简历没有原始文件');
    }

    if (!fs.existsSync(resume.filePath)) {
      throw new NotFoundException('原始文件不存在');
    }

    // 记录审计日志
    if (userId) {
      await this.auditService.log(
        id,
        ResumeActionType.DOWNLOAD,
        userId,
        { fileName: resume.fileName },
      );
    }

    return {
      filePath: resume.filePath,
      fileName: resume.fileName || 'resume.pdf',
    };
  }

  /**
   * 获取导入报告统计
   */
  async getImportReport(
    userId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalImported: number;
    successCount: number;
    failedCount: number;
    pendingCount: number;
    recentImports: Resume[];
  }> {
    const queryBuilder = this.resumesRepository
      .createQueryBuilder('resume')
      .where('resume.importedBy = :userId', { userId })
      .andWhere('resume.isDeleted = :isDeleted', { isDeleted: false });

    if (startDate) {
      queryBuilder.andWhere('resume.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('resume.createdAt <= :endDate', { endDate });
    }

    const allResumes = await queryBuilder.getMany();

    const successCount = allResumes.filter(
      (r) => r.parseStatus === ParseStatus.SUCCESS,
    ).length;
    const failedCount = allResumes.filter(
      (r) => r.parseStatus === ParseStatus.FAILED,
    ).length;
    const pendingCount = allResumes.filter(
      (r) => r.parseStatus === ParseStatus.PENDING,
    ).length;

    const recentImports = await queryBuilder
      .orderBy('resume.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return {
      totalImported: allResumes.length,
      successCount,
      failedCount,
      pendingCount,
      recentImports,
    };
  }

  async uploadResume(
    file: Express.Multer.File,
    jobId: number | undefined,
    userId: number,
    enableMultiDetection: boolean = false,
  ): Promise<Resume | Resume[]> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    // 验证文件类型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/json',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      // 删除已上传的文件
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException(
        '不支持的文件类型，仅支持 PDF、DOC、DOCX、TXT、JSON',
      );
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      // 删除已上传的文件
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException('文件大小不能超过 10MB');
    }

    // 创建简历记录
    const resume = this.resumesRepository.create({
      name: '待解析',
      phone: `temp_${Date.now()}`,
      email: `temp_${Date.now()}@pending.com`,
      fileName: file.originalname,
      filePath: file.path,
      jobId,
      importedBy: userId,
      parseStatus: ParseStatus.PENDING,
    });

    const savedResume = await this.resumesRepository.save(resume);

    // 记录审计日志
    await this.auditService.log(
      savedResume.id,
      ResumeActionType.UPLOAD,
      userId,
      { fileName: file.originalname, fileSize: file.size },
    );

    // 异步解析简历（支持多简历检测）
    this.parseResumeAsync(savedResume.id, file.path, userId, enableMultiDetection, jobId);

    return savedResume;
  }

  private async parseResumeAsync(
    resumeId: number,
    filePath: string,
    userId?: number,
    enableMultiDetection: boolean = false,
    jobId?: number,
  ) {
    try {
      const resume = await this.resumesRepository.findOne({
        where: { id: resumeId },
      });

      if (!resume) return;

      // 使用AI解析简历（支持多简历检测）
      setTimeout(async () => {
        try {
          // 确保原始文件存在
          if (!fs.existsSync(filePath)) {
            throw new Error('原始文件不存在');
          }

          // 如果启用多简历检测
          if (enableMultiDetection) {
            const multiResult = await this.aiService.detectAndParseMultipleResumes(filePath);
            
            if (multiResult.isMultiple && multiResult.resumes.length > 1) {
              // 检测到多个简历，创建多条记录
              await this.handleMultipleResumes(
                resumeId,
                multiResult.resumes,
                filePath,
                jobId,
                userId,
              );
              return;
            }
            
            // 单个简历，使用第一个解析结果
            const parsed = multiResult.resumes[0] || await this.aiService.parseResume(filePath);
            await this.updateResumeWithParsedData(resumeId, parsed, userId);
            return;
          }

          // 默认：按单个简历解析
          const parsed = await this.aiService.parseResume(filePath);

          // 检查手机号是否重复（排除临时手机号）
          const isTempPhone = parsed.phone && (
            parsed.phone.startsWith('temp_') || 
            parsed.phone === '00000000000' ||
            parsed.phone.includes('@pending.com')
          );

          if (parsed.phone && parsed.phone !== resume.phone && !isTempPhone) {
            const existingByPhone = await this.resumesRepository.findOne({
              where: { phone: parsed.phone, isDeleted: false },
            });

            if (existingByPhone && existingByPhone.id !== resumeId) {
              // 手机号重复，标记为失败
              resume.parseStatus = ParseStatus.FAILED;
              resume.parseError = `手机号 ${parsed.phone} 已存在`;
              await this.resumesRepository.save(resume);

              // 记录审计日志
              if (userId) {
                await this.auditService.log(
                  resumeId,
                  ResumeActionType.PARSE,
                  userId,
                  { status: 'failed', error: resume.parseError },
                );
              }
              return;
            }
          }

          // 更新简历信息
          // 如果是待手动录入状态，标记为需要编辑而不是成功
          const needsManualEdit = parsed.name && (
            parsed.name.includes('待手动录入') ||
            parsed.summary?.includes('请手动编辑')
          );

          Object.assign(resume, {
            name: parsed.name || resume.name,
            phone: parsed.phone || resume.phone,
            email: parsed.email || resume.email,
            gender: parsed.gender,
            age: parsed.age,
            skills: parsed.skills || [],
            experience: parsed.experience || [],
            education: parsed.education || [],
            yearsOfExperience: parsed.yearsOfExperience,
            parseStatus: needsManualEdit ? ParseStatus.FAILED : ParseStatus.SUCCESS,
            parseError: needsManualEdit ? (parsed.summary || '简历需要手动编辑录入') : null,
          });

          await this.resumesRepository.save(resume);

          // 记录审计日志
          if (userId) {
            await this.auditService.log(
              resumeId,
              ResumeActionType.PARSE,
              userId,
              { status: 'success', name: resume.name },
            );
          }

          console.log(`简历解析成功: ${resume.name}`);
        } catch (error) {
          console.error('Resume parsing error:', error);
          resume.parseStatus = ParseStatus.FAILED;
          resume.parseError = error.message || 'AI解析失败，请手动录入';
          await this.resumesRepository.save(resume);

          // 记录审计日志
          if (userId) {
            await this.auditService.log(
              resumeId,
              ResumeActionType.PARSE,
              userId,
              { status: 'failed', error: resume.parseError },
            );
          }
        }
      }, 2000); // 延迟2秒执行，避免并发问题
    } catch (error) {
      console.error('Resume parsing async error:', error);
    }
  }

  async linkToJob(
    resumeId: number,
    jobId: number,
    userId?: number,
  ): Promise<Resume> {
    const resume = await this.findOne(resumeId);
    resume.jobId = jobId;
    const savedResume = await this.resumesRepository.save(resume);

    // 记录审计日志
    if (userId) {
      await this.auditService.log(
        resumeId,
        ResumeActionType.LINK_JOB,
        userId,
        { jobId },
      );
    }

    return savedResume;
  }

  async getStatistics() {
    const total = await this.resumesRepository.count({
      where: { isDeleted: false },
    });

    const statusCounts = await this.resumesRepository
      .createQueryBuilder('resume')
      .select('resume.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('resume.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('resume.status')
      .getRawMany();

    return {
      total,
      statusCounts,
    };
  }

  /**
   * 处理一个文件中的多个简历
   */
  private async handleMultipleResumes(
    originalResumeId: number,
    parsedResumes: any[],
    filePath: string,
    jobId?: number,
    userId?: number,
  ): Promise<void> {
    try {
      console.log(`检测到多个简历（共${parsedResumes.length}份），开始创建记录...`);
      
      const createdResumes: Resume[] = [];
      
      for (let i = 0; i < parsedResumes.length; i++) {
        const parsed = parsedResumes[i];
        
        try {
          // 检查手机号是否重复
          const isTempPhone = parsed.phone && (
            parsed.phone.startsWith('temp_') ||
            parsed.phone === '00000000000' ||
            parsed.phone.includes('@pending.com')
          );

          if (!isTempPhone && parsed.phone) {
            const existingByPhone = await this.resumesRepository.findOne({
              where: { phone: parsed.phone, isDeleted: false },
            });

            if (existingByPhone) {
              console.log(`跳过重复简历: ${parsed.name} (手机号已存在)`);
              continue;
            }
          }

          // 创建新简历记录（第一个使用原记录，其他创建新记录）
          let resume: Resume;
          
          if (i === 0) {
            // 更新第一个简历到原记录
            resume = await this.resumesRepository.findOne({
              where: { id: originalResumeId },
            });
            
            Object.assign(resume, {
              name: parsed.name || '待完善',
              phone: parsed.phone || `temp_${Date.now()}_${i}`,
              email: parsed.email || `temp_${Date.now()}_${i}@pending.com`,
              gender: parsed.gender,
              age: parsed.age,
              skills: parsed.skills || [],
              experience: parsed.experience || [],
              education: parsed.education || [],
              yearsOfExperience: parsed.yearsOfExperience,
              parseStatus: ParseStatus.SUCCESS,
              parseError: null,
            });
          } else {
            // 创建新的简历记录
            resume = this.resumesRepository.create({
              name: parsed.name || '待完善',
              phone: parsed.phone || `temp_${Date.now()}_${i}`,
              email: parsed.email || `temp_${Date.now()}_${i}@pending.com`,
              gender: parsed.gender,
              age: parsed.age,
              skills: parsed.skills || [],
              experience: parsed.experience || [],
              education: parsed.education || [],
              yearsOfExperience: parsed.yearsOfExperience,
              fileName: `${path.basename(filePath)} - 简历${i + 1}`,
              filePath: filePath, // 共享同一个文件
              jobId,
              importedBy: userId,
              parseStatus: ParseStatus.SUCCESS,
            });
          }

          const savedResume = await this.resumesRepository.save(resume);
          createdResumes.push(savedResume);

          // 记录审计日志
          if (userId) {
            await this.auditService.log(
              savedResume.id,
              i === 0 ? ResumeActionType.PARSE : ResumeActionType.CREATE,
              userId,
              {
                multiResumeIndex: i + 1,
                totalCount: parsedResumes.length,
                name: savedResume.name,
              },
            );
          }

          console.log(`创建简历 ${i + 1}/${parsedResumes.length}: ${parsed.name}`);
        } catch (error) {
          console.error(`创建简历 ${i + 1} 失败:`, error.message);
        }
      }

      console.log(`多简历处理完成: 成功创建 ${createdResumes.length}/${parsedResumes.length} 份简历`);
    } catch (error) {
      console.error('处理多简历失败:', error);
      throw error;
    }
  }

  /**
   * 使用解析后的数据更新简历
   */
  private async updateResumeWithParsedData(
    resumeId: number,
    parsed: any,
    userId?: number,
  ): Promise<void> {
    const resume = await this.resumesRepository.findOne({
      where: { id: resumeId },
    });

    if (!resume) return;

    try {
      // 检查手机号是否重复
      const isTempPhone = parsed.phone && (
        parsed.phone.startsWith('temp_') ||
        parsed.phone === '00000000000' ||
        parsed.phone.includes('@pending.com')
      );

      if (parsed.phone && parsed.phone !== resume.phone && !isTempPhone) {
        const existingByPhone = await this.resumesRepository.findOne({
          where: { phone: parsed.phone, isDeleted: false },
        });

        if (existingByPhone && existingByPhone.id !== resumeId) {
          resume.parseStatus = ParseStatus.FAILED;
          resume.parseError = `手机号 ${parsed.phone} 已存在`;
          await this.resumesRepository.save(resume);

          if (userId) {
            await this.auditService.log(
              resumeId,
              ResumeActionType.PARSE,
              userId,
              { status: 'failed', error: resume.parseError },
            );
          }
          return;
        }
      }

      // 更新简历信息
      const needsManualEdit = parsed.name && (
        parsed.name.includes('待手动录入') ||
        parsed.summary?.includes('请手动编辑')
      );

      Object.assign(resume, {
        name: parsed.name || resume.name,
        phone: parsed.phone || resume.phone,
        email: parsed.email || resume.email,
        gender: parsed.gender,
        age: parsed.age,
        skills: parsed.skills || [],
        experience: parsed.experience || [],
        education: parsed.education || [],
        yearsOfExperience: parsed.yearsOfExperience,
        parseStatus: needsManualEdit ? ParseStatus.FAILED : ParseStatus.SUCCESS,
        parseError: needsManualEdit ? (parsed.summary || '简历需要手动编辑录入') : null,
      });

      await this.resumesRepository.save(resume);

      if (userId) {
        await this.auditService.log(
          resumeId,
          ResumeActionType.PARSE,
          userId,
          { status: 'success', name: resume.name },
        );
      }

      console.log(`简历解析成功: ${resume.name}`);
    } catch (error) {
      console.error('更新简历失败:', error);
      throw error;
    }
  }
}

