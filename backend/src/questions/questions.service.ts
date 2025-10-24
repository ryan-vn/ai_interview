import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ImportQuestionsDto, ImportResultDto } from './dto/import-questions.dto';
import { QuestionImportService } from './question-import.service';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
    private questionImportService: QuestionImportService,
    private auditLogService: AuditLogService,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    userId: number,
  ): Promise<Question> {
    // 校验标签数量（最多5个）
    if (createQuestionDto.tags && createQuestionDto.tags.length > 5) {
      throw new BadRequestException('标签数量不能超过5个');
    }

    // 检查题目标题是否重复
    const existing = await this.questionsRepository.findOne({
      where: { title: createQuestionDto.title, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException(`题目 "${createQuestionDto.title}" 已存在`);
    }

    const question = this.questionsRepository.create({
      ...createQuestionDto,
      createdBy: userId,
    });

    const savedQuestion = await this.questionsRepository.save(question);

    // 记录审计日志
    await this.auditLogService.logQuestionCreate(
      savedQuestion.id,
      savedQuestion.title,
      createQuestionDto,
      userId,
    );

    return savedQuestion;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    type?: string,
    difficulty?: string,
    tags?: string[],
    keyword?: string,
  ): Promise<{ data: Question[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.questionsRepository
      .createQueryBuilder('question')
      .leftJoinAndSelect('question.creator', 'creator')
      .where('question.isDeleted = :isDeleted', { isDeleted: false });

    if (type) {
      queryBuilder.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', {
        difficulty,
      });
    }

    if (tags && tags.length > 0) {
      // 搜索tags字段中包含任一标签
      const tagConditions = tags.map((tag, index) => {
        return `JSON_CONTAINS(question.tags, '"${tag}"')`;
      });
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`);
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(question.title LIKE :keyword OR question.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('question.createdAt', 'DESC')
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

  async findOne(id: number): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['creator', 'submissions'],
    });

    if (!question) {
      throw new NotFoundException(`题目 #${id} 不存在`);
    }

    return question;
  }

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    userId?: number,
  ): Promise<Question> {
    const question = await this.findOne(id);

    // 保存旧数据用于审计日志
    const oldData = { ...question };

    // 校验标签数量（最多5个）
    if (updateQuestionDto.tags && updateQuestionDto.tags.length > 5) {
      throw new BadRequestException('标签数量不能超过5个');
    }

    // 如果修改了标题，检查是否重复
    if (updateQuestionDto.title && updateQuestionDto.title !== question.title) {
      const existing = await this.questionsRepository.findOne({
        where: { title: updateQuestionDto.title, isDeleted: false },
      });

      if (existing) {
        throw new ConflictException(`题目 "${updateQuestionDto.title}" 已存在`);
      }
    }

    Object.assign(question, updateQuestionDto);
    const updatedQuestion = await this.questionsRepository.save(question);

    // 记录审计日志
    if (userId) {
      await this.auditLogService.logQuestionUpdate(
        question.id,
        question.title,
        oldData,
        updateQuestionDto,
        userId,
      );
    }

    return updatedQuestion;
  }

  async remove(id: number, userId?: number): Promise<void> {
    const question = await this.findOne(id);

    // 检查是否有面试使用此题目
    if (question.submissions && question.submissions.length > 0) {
      throw new BadRequestException(
        `题目 "${question.title}" 已被 ${question.submissions.length} 个提交使用，无法删除`,
      );
    }

    // 保存删除前数据
    const deletedData = { ...question };

    // 软删除
    question.isDeleted = true;
    await this.questionsRepository.save(question);

    // 记录审计日志
    if (userId) {
      await this.auditLogService.logQuestionDelete(
        question.id,
        question.title,
        deletedData,
        userId,
      );
    }
  }

  async findByIds(ids: number[]): Promise<Question[]> {
    return this.questionsRepository.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
    });
  }

  async importQuestions(
    importDto: ImportQuestionsDto,
    userId: number,
  ): Promise<ImportResultDto> {
    const result: ImportResultDto = {
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    // 检查重复题干
    const duplicateTitles = this.questionImportService.checkDuplicateTitles(
      importDto.questions,
    );
    if (duplicateTitles.length > 0) {
      throw new BadRequestException(
        `导入数据中存在重复题干: ${duplicateTitles.join(', ')}`,
      );
    }

    for (let i = 0; i < importDto.questions.length; i++) {
      try {
        const questionDto = importDto.questions[i];
        
        // 校验必填字段
        if (!questionDto.title || !questionDto.title.trim()) {
          throw new Error('题干不能为空');
        }
        if (!questionDto.description || !questionDto.description.trim()) {
          throw new Error('答案/描述不能为空');
        }

        // 校验标签数量
        if (questionDto.tags && questionDto.tags.length > 5) {
          throw new Error(`标签数量不能超过5个，当前${questionDto.tags.length}个`);
        }

        // 检查数据库中是否已存在相同题干（跳过已存在的）
        const existing = await this.questionsRepository.findOne({
          where: { title: questionDto.title, isDeleted: false },
        });

        if (existing) {
          result.failedCount++;
          result.errors.push({
            index: i,
            data: questionDto,
            error: `题目 "${questionDto.title}" 已存在`,
          });
          continue;
        }

        await this.create(questionDto, userId);
        result.successCount++;
      } catch (error) {
        result.failedCount++;
        result.errors.push({
          index: i,
          data: importDto.questions[i],
          error: error.message || '未知错误',
        });
      }
    }

    // 记录导入审计日志
    await this.auditLogService.logQuestionImport(
      {
        successCount: result.successCount,
        failedCount: result.failedCount,
      },
      userId,
    );

    return result;
  }

  async batchRemove(ids: number[], userId?: number): Promise<void> {
    for (const id of ids) {
      await this.remove(id, userId);
    }
  }

  async getStatistics() {
    const total = await this.questionsRepository.count({
      where: { isDeleted: false },
    });

    const typeCounts = await this.questionsRepository
      .createQueryBuilder('question')
      .select('question.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('question.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('question.type')
      .getRawMany();

    const difficultyCounts = await this.questionsRepository
      .createQueryBuilder('question')
      .select('question.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .where('question.isDeleted = :isDeleted', { isDeleted: false })
      .groupBy('question.difficulty')
      .getRawMany();

    return {
      total,
      typeCounts,
      difficultyCounts,
    };
  }
}

