import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuestionTag } from './entities/tag.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(QuestionTag)
    private tagsRepository: Repository<QuestionTag>,
  ) {}

  async create(createTagDto: CreateTagDto, userId: number): Promise<QuestionTag> {
    // 检查标签名称是否已存在
    const existing = await this.tagsRepository.findOne({
      where: { name: createTagDto.name, isDeleted: false },
    });

    if (existing) {
      throw new ConflictException('标签名称已存在');
    }

    // 如果有父标签，验证父标签是否存在
    if (createTagDto.parentId) {
      const parent = await this.tagsRepository.findOne({
        where: { id: createTagDto.parentId, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException(`父标签 #${createTagDto.parentId} 不存在`);
      }
    }

    const tag = this.tagsRepository.create({
      ...createTagDto,
      createdBy: userId,
    });

    return await this.tagsRepository.save(tag);
  }

  async findAll(
    category?: string,
    parentId?: number,
  ): Promise<QuestionTag[]> {
    const queryBuilder = this.tagsRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.parent', 'parent')
      .leftJoinAndSelect('tag.creator', 'creator')
      .where('tag.isDeleted = :isDeleted', { isDeleted: false });

    if (category) {
      queryBuilder.andWhere('tag.category = :category', { category });
    }

    if (parentId !== undefined) {
      if (parentId === null || parentId === 0) {
        queryBuilder.andWhere('tag.parentId IS NULL');
      } else {
        queryBuilder.andWhere('tag.parentId = :parentId', { parentId });
      }
    }

    return await queryBuilder.orderBy('tag.createdAt', 'DESC').getMany();
  }

  async findOne(id: number): Promise<QuestionTag> {
    const tag = await this.tagsRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['parent', 'creator'],
    });

    if (!tag) {
      throw new NotFoundException(`标签 #${id} 不存在`);
    }

    return tag;
  }

  async update(
    id: number,
    updateTagDto: UpdateTagDto,
  ): Promise<QuestionTag> {
    const tag = await this.findOne(id);

    // 如果修改了名称，检查是否冲突
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const existing = await this.tagsRepository.findOne({
        where: { name: updateTagDto.name, isDeleted: false },
      });

      if (existing) {
        throw new ConflictException('标签名称已存在');
      }
    }

    // 如果修改了父标签，验证父标签是否存在
    if (updateTagDto.parentId) {
      const parent = await this.tagsRepository.findOne({
        where: { id: updateTagDto.parentId, isDeleted: false },
      });
      if (!parent) {
        throw new NotFoundException(`父标签 #${updateTagDto.parentId} 不存在`);
      }
    }

    Object.assign(tag, updateTagDto);
    return await this.tagsRepository.save(tag);
  }

  async remove(id: number): Promise<void> {
    const tag = await this.findOne(id);

    // TODO: 检查是否有题目关联此标签
    // 暂时实现软删除
    tag.isDeleted = true;
    await this.tagsRepository.save(tag);
  }

  async getTree(): Promise<QuestionTag[]> {
    // 获取所有根标签（没有父标签的）
    const rootTags = await this.tagsRepository.find({
      where: { parentId: null, isDeleted: false },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });

    // 为每个根标签获取子标签
    for (const root of rootTags) {
      const children = await this.tagsRepository.find({
        where: { parentId: root.id, isDeleted: false },
        relations: ['creator'],
        order: { createdAt: 'DESC' },
      });
      (root as any).children = children;
    }

    return rootTags;
  }
}

