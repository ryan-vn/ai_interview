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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { QuestionTag } from './entities/tag.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('题目标签管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('question-tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '创建标签' })
  @ApiResponse({ status: 201, description: '创建成功', type: QuestionTag })
  @ApiResponse({ status: 409, description: '标签名称已存在' })
  create(@Body() createTagDto: CreateTagDto, @CurrentUser() user: any) {
    return this.tagsService.create(createTagDto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取标签列表' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: '标签分类',
  })
  @ApiQuery({
    name: 'parentId',
    required: false,
    description: '父标签ID（0表示根标签）',
  })
  @ApiResponse({ status: 200, description: '获取成功', type: [QuestionTag] })
  findAll(
    @Query('category') category?: string,
    @Query('parentId') parentId?: string,
  ) {
    const parentIdNum = parentId ? parseInt(parentId) : undefined;
    return this.tagsService.findAll(category, parentIdNum);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取标签树形结构' })
  @ApiResponse({ status: 200, description: '获取成功', type: [QuestionTag] })
  getTree() {
    return this.tagsService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取标签详情' })
  @ApiResponse({ status: 200, description: '获取成功', type: QuestionTag })
  @ApiResponse({ status: 404, description: '标签不存在' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '更新标签' })
  @ApiResponse({ status: 200, description: '更新成功', type: QuestionTag })
  @ApiResponse({ status: 404, description: '标签不存在' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Delete(':id')
  @Roles('admin', 'hr')
  @ApiOperation({ summary: '删除标签' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '标签不存在' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.tagsService.remove(id);
    return { message: '删除成功' };
  }
}

