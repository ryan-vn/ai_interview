import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { QuestionType, QuestionDifficulty } from './entities/question.entity';
import * as Papa from 'papaparse';

export interface ParsedQuestion {
  题干?: string;
  答案?: string;
  标签?: string;
  类型?: string;
  难度?: string;
}

export interface ParseResult {
  questions: CreateQuestionDto[];
  errors: Array<{
    line: number;
    data: any;
    error: string;
  }>;
}

@Injectable()
export class QuestionImportService {
  /**
   * 解析CSV/TXT文件内容
   * 支持格式：题干, 答案, 标签, 类型, 难度
   */
  parseCSV(fileContent: string): ParseResult {
    const result: ParseResult = {
      questions: [],
      errors: [],
    };

    try {
      // 使用 papaparse 解析 CSV
      const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
      });

      parsed.data.forEach((row: ParsedQuestion, index) => {
        try {
          const question = this.validateAndTransform(row, index + 2); // +2 因为第一行是表头，index从0开始
          result.questions.push(question);
        } catch (error) {
          result.errors.push({
            line: index + 2,
            data: row,
            error: error.message,
          });
        }
      });
    } catch (error) {
      throw new BadRequestException(`文件解析失败: ${error.message}`);
    }

    return result;
  }

  /**
   * 解析纯文本格式
   * 格式：每题以空行分隔，每行格式为 "字段名: 值"
   */
  parseTXT(fileContent: string): ParseResult {
    const result: ParseResult = {
      questions: [],
      errors: [],
    };

    const sections = fileContent.split(/\n\s*\n/); // 以空行分隔
    
    sections.forEach((section, index) => {
      if (!section.trim()) return;

      try {
        const lines = section.split('\n');
        const questionData: any = {};

        lines.forEach(line => {
          const match = line.match(/^(.+?)[:：]\s*(.+)$/);
          if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            questionData[key] = value;
          }
        });

        const question = this.validateAndTransform(questionData, index + 1);
        result.questions.push(question);
      } catch (error) {
        result.errors.push({
          line: index + 1,
          data: section,
          error: error.message,
        });
      }
    });

    return result;
  }

  /**
   * 验证并转换为 CreateQuestionDto
   */
  private validateAndTransform(
    row: any,
    lineNumber: number,
  ): CreateQuestionDto {
    // 获取题干（支持多种表头名称）
    const title = row['题干'] || row['标题'] || row['title'] || '';
    if (!title || !title.trim()) {
      throw new Error(`第${lineNumber}行：题干不能为空`);
    }

    // 获取答案
    const answer = row['答案'] || row['标准答案'] || row['answer'] || '';
    if (!answer || !answer.trim()) {
      throw new Error(`第${lineNumber}行：答案不能为空`);
    }

    // 解析标签（支持逗号、|、；分隔）
    const tagsStr = row['标签'] || row['tags'] || '';
    const tags = tagsStr
      ? tagsStr.split(/[,，|；;]/).map((t: string) => t.trim()).filter(Boolean)
      : [];

    // 验证标签数量（最多5个）
    if (tags.length > 5) {
      throw new Error(`第${lineNumber}行：标签数量不能超过5个，当前${tags.length}个`);
    }

    // 解析类型
    const typeStr = row['类型'] || row['type'] || 'qa';
    const type = this.parseQuestionType(typeStr);
    if (!type) {
      throw new Error(
        `第${lineNumber}行：无效的题目类型 "${typeStr}"，支持的类型：programming, qa, behavioral, technical_qa`,
      );
    }

    // 解析难度
    const difficultyStr = row['难度'] || row['difficulty'] || 'medium';
    const difficulty = this.parseDifficulty(difficultyStr);
    if (!difficulty) {
      throw new Error(
        `第${lineNumber}行：无效的难度 "${difficultyStr}"，支持的难度：easy, medium, hard`,
      );
    }

    return {
      type,
      title: title.trim(),
      description: answer.trim(),
      difficulty,
      tags,
      standardAnswer: answer.trim(),
      answerPoints: this.extractAnswerPoints(answer.trim()),
    } as CreateQuestionDto;
  }

  /**
   * 解析题目类型
   */
  private parseQuestionType(typeStr: string): QuestionType | null {
    const normalizedType = typeStr.toLowerCase().trim();
    const typeMap: Record<string, QuestionType> = {
      'programming': QuestionType.PROGRAMMING,
      '编程题': QuestionType.PROGRAMMING,
      '编程': QuestionType.PROGRAMMING,
      'qa': QuestionType.QA,
      '问答': QuestionType.QA,
      '问答题': QuestionType.QA,
      'behavioral': QuestionType.BEHAVIORAL,
      '行为面试': QuestionType.BEHAVIORAL,
      '行为': QuestionType.BEHAVIORAL,
      'technical_qa': QuestionType.TECHNICAL_QA,
      '技术问答': QuestionType.TECHNICAL_QA,
    };

    return typeMap[normalizedType] || null;
  }

  /**
   * 解析难度
   */
  private parseDifficulty(difficultyStr: string): QuestionDifficulty | null {
    const normalizedDifficulty = difficultyStr.toLowerCase().trim();
    const difficultyMap: Record<string, QuestionDifficulty> = {
      'easy': QuestionDifficulty.EASY,
      '简单': QuestionDifficulty.EASY,
      'medium': QuestionDifficulty.MEDIUM,
      '中等': QuestionDifficulty.MEDIUM,
      'hard': QuestionDifficulty.HARD,
      '困难': QuestionDifficulty.HARD,
    };

    return difficultyMap[normalizedDifficulty] || null;
  }

  /**
   * 提取答案要点（简单实现：按句号、分号等分割）
   */
  private extractAnswerPoints(answer: string): string[] {
    // 按常见分隔符分割
    const points = answer
      .split(/[。；;\n]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return points.length > 1 ? points : undefined;
  }

  /**
   * 检查重复题干
   */
  checkDuplicateTitles(questions: CreateQuestionDto[]): string[] {
    const titles = new Set<string>();
    const duplicates: string[] = [];

    questions.forEach(q => {
      if (titles.has(q.title)) {
        duplicates.push(q.title);
      } else {
        titles.add(q.title);
      }
    });

    return duplicates;
  }

  /**
   * 生成导入报告
   */
  generateImportReport(
    parseResult: ParseResult,
    importResult: {
      successCount: number;
      failedCount: number;
      errors: any[];
    },
  ): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(50));
    lines.push('题库导入报告');
    lines.push('='.repeat(50));
    lines.push('');
    lines.push(`解析结果：`);
    lines.push(`  - 成功解析：${parseResult.questions.length} 条`);
    lines.push(`  - 解析失败：${parseResult.errors.length} 条`);
    lines.push('');
    lines.push(`导入结果：`);
    lines.push(`  - 成功导入：${importResult.successCount} 条`);
    lines.push(`  - 导入失败：${importResult.failedCount} 条`);
    lines.push('');

    if (parseResult.errors.length > 0) {
      lines.push('解析错误详情：');
      parseResult.errors.forEach((err, index) => {
        lines.push(`  ${index + 1}. 第${err.line}行: ${err.error}`);
      });
      lines.push('');
    }

    if (importResult.errors.length > 0) {
      lines.push('导入错误详情：');
      importResult.errors.forEach((err, index) => {
        lines.push(`  ${index + 1}. ${err.error}`);
      });
      lines.push('');
    }

    lines.push('='.repeat(50));
    
    return lines.join('\n');
  }
}

