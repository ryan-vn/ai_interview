import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { ImportQuestionsDto, ImportResultDto } from './dto/import-questions.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private questionsRepository: Repository<Question>,
  ) {}

  async create(
    createQuestionDto: CreateQuestionDto,
    userId: number,
  ): Promise<Question> {
    const question = this.questionsRepository.create({
      ...createQuestionDto,
      createdBy: userId,
    });

    return this.questionsRepository.save(question);
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
      relations: ['creator'],
    });

    if (!question) {
      throw new NotFoundException(`题目 #${id} 不存在`);
    }

    return question;
  }

  async update(
    id: number,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    const question = await this.findOne(id);
    Object.assign(question, updateQuestionDto);
    return this.questionsRepository.save(question);
  }

  async remove(id: number): Promise<void> {
    const question = await this.findOne(id);
    // 软删除
    question.isDeleted = true;
    await this.questionsRepository.save(question);
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

    for (let i = 0; i < importDto.questions.length; i++) {
      try {
        const questionDto = importDto.questions[i];
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

    return result;
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
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

