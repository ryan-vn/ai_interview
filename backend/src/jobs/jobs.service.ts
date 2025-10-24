import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
  ) {}

  async create(createJobDto: CreateJobDto, userId: number): Promise<Job> {
    // 检查同部门同名岗位是否已存在
    const existing = await this.jobsRepository.findOne({
      where: {
        title: createJobDto.title,
        department: createJobDto.department,
        isDeleted: false,
      },
    });

    if (existing) {
      throw new ConflictException('同部门已存在同名岗位');
    }

    const job = this.jobsRepository.create({
      ...createJobDto,
      createdBy: userId,
    });

    return await this.jobsRepository.save(job);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: string,
    department?: string,
    keyword?: string,
  ): Promise<{ data: Job[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.jobsRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.creator', 'creator')
      .where('job.isDeleted = :isDeleted', { isDeleted: false });

    if (status) {
      queryBuilder.andWhere('job.status = :status', { status });
    }

    if (department) {
      queryBuilder.andWhere('job.department = :department', { department });
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(job.title LIKE :keyword OR job.requirements LIKE :keyword OR job.responsibilities LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('job.createdAt', 'DESC')
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

  async findOne(id: number): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['creator'],
    });

    if (!job) {
      throw new NotFoundException(`岗位 #${id} 不存在`);
    }

    return job;
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
    userId: number,
  ): Promise<Job> {
    const job = await this.findOne(id);

    // 如果修改了名称或部门，检查是否冲突
    if (updateJobDto.title || updateJobDto.department) {
      const title = updateJobDto.title || job.title;
      const department = updateJobDto.department || job.department;

      const existing = await this.jobsRepository.findOne({
        where: {
          title,
          department,
          isDeleted: false,
        },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('同部门已存在同名岗位');
      }
    }

    Object.assign(job, updateJobDto);
    return await this.jobsRepository.save(job);
  }

  async remove(id: number): Promise<void> {
    const job = await this.findOne(id);
    
    // TODO: 检查是否有关联的简历或面试
    // 这里先实现软删除
    job.isDeleted = true;
    await this.jobsRepository.save(job);
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  async getDepartments(): Promise<string[]> {
    const result = await this.jobsRepository
      .createQueryBuilder('job')
      .select('DISTINCT job.department', 'department')
      .where('job.isDeleted = :isDeleted', { isDeleted: false })
      .getRawMany();

    return result.map((r) => r.department).filter(Boolean);
  }
}

