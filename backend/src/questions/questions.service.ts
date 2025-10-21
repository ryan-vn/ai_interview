import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

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

  async findAll(type?: string, difficulty?: string): Promise<Question[]> {
    const queryBuilder = this.questionsRepository.createQueryBuilder('question');

    if (type) {
      queryBuilder.andWhere('question.type = :type', { type });
    }

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', {
        difficulty,
      });
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!question) {
      throw new NotFoundException(`Question with ID ${id} not found`);
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
    await this.questionsRepository.remove(question);
  }

  async findByIds(ids: number[]): Promise<Question[]> {
    return this.questionsRepository.findByIds(ids);
  }
}

