import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resume, ParseStatus } from './entities/resume.entity';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResumesService {
  constructor(
    @InjectRepository(Resume)
    private resumesRepository: Repository<Resume>,
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

    return await this.resumesRepository.save(resume);
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

  async update(id: number, updateResumeDto: UpdateResumeDto): Promise<Resume> {
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

    Object.assign(resume, updateResumeDto);
    return await this.resumesRepository.save(resume);
  }

  async remove(id: number): Promise<void> {
    const resume = await this.findOne(id);

    // 软删除
    resume.isDeleted = true;
    await this.resumesRepository.save(resume);
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async uploadResume(
    file: Express.Multer.File,
    jobId: number | undefined,
    userId: number,
  ): Promise<Resume> {
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
      throw new BadRequestException(
        '不支持的文件类型，仅支持 PDF、DOC、DOCX、TXT、JSON',
      );
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
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

    // 异步解析简历（这里简化处理，实际应该调用解析服务）
    this.parseResumeAsync(savedResume.id, file.path);

    return savedResume;
  }

  private async parseResumeAsync(resumeId: number, filePath: string) {
    try {
      // TODO: 实际应该调用专业的简历解析服务
      // 这里简化处理，仅作示例
      const resume = await this.resumesRepository.findOne({
        where: { id: resumeId },
      });

      if (!resume) return;

      // 模拟解析过程
      setTimeout(async () => {
        try {
          // 这里应该调用真实的解析服务
          // 暂时标记为解析失败，需要手动录入
          resume.parseStatus = ParseStatus.FAILED;
          resume.parseError = '需要手动录入简历信息';
          await this.resumesRepository.save(resume);
        } catch (error) {
          console.error('Resume parsing error:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Resume parsing async error:', error);
    }
  }

  async linkToJob(resumeId: number, jobId: number): Promise<Resume> {
    const resume = await this.findOne(resumeId);
    resume.jobId = jobId;
    return await this.resumesRepository.save(resume);
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
}

