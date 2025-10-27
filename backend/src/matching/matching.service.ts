import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchResult } from './entities/match-result.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { Resume } from '../resumes/entities/resume.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @InjectRepository(MatchResult)
    private matchResultsRepository: Repository<MatchResult>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(Resume)
    private resumesRepository: Repository<Resume>,
    private aiService: AiService,
  ) {}

  /**
   * 计算简历与岗位的匹配度
   * 使用 AI 进行智能分析
   */
  async calculateMatch(resumeId: number, jobId: number): Promise<MatchResult> {
    const startTime = Date.now();
    
    try {
      const resume = await this.resumesRepository.findOne({
        where: { id: resumeId, isDeleted: false },
      });
      const job = await this.jobsRepository.findOne({
        where: { id: jobId, isDeleted: false },
      });

      if (!resume || !job) {
        throw new Error('简历或岗位不存在');
      }

      this.logger.log(`开始计算匹配度: 简历 ${resumeId} - 岗位 ${jobId}`);

      // 构建简历文本
      const resumeText = this.buildResumeText(resume);
      
      // 构建岗位文本
      const jobText = `${job.title}\n\n${job.requirements}`;

      // 调用 AI 服务进行智能匹配分析
      const aiAnalysis = await this.aiService.calculateMatchScore(
        resumeText,
        job.title,
        job.requirements,
      );

      this.logger.log(`AI 分析完成: 匹配度 ${aiAnalysis.score}%`);

      // 提取匹配和缺失的关键词（从 AI 分析的优势和不足中提取）
      const matchedKeywords = this.extractKeywordsFromStrengths(
        aiAnalysis.strengths,
        resume.skills || [],
      );
      const missingKeywords = this.extractKeywordsFromWeaknesses(
        aiAnalysis.weaknesses,
        job.skillKeywords || [],
      );

      // 检查是否已存在匹配记录
      let matchResult = await this.matchResultsRepository.findOne({
        where: { resumeId, jobId },
      });

      // 生成详细的匹配报告
      const details = this.generateAiMatchDetails(
        aiAnalysis.score,
        aiAnalysis.analysis,
        aiAnalysis.strengths,
        aiAnalysis.weaknesses,
      );

      if (matchResult) {
        // 更新现有记录
        matchResult.score = Math.round(aiAnalysis.score * 10) / 10;
        matchResult.matchedKeywords = matchedKeywords;
        matchResult.missingKeywords = missingKeywords;
        matchResult.details = details;
      } else {
        // 创建新记录
        matchResult = this.matchResultsRepository.create({
          resumeId,
          jobId,
          score: Math.round(aiAnalysis.score * 10) / 10,
          matchedKeywords,
          missingKeywords,
          details,
        });
      }

      const result = await this.matchResultsRepository.save(matchResult);
      
      const duration = Date.now() - startTime;
      this.logger.log(`匹配度计算完成，耗时: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `匹配度计算失败 (耗时: ${duration}ms): ${error.message}`,
      );
      throw new Error(`AI 匹配分析失败: ${error.message}`);
    }
  }

  /**
   * 构建简历文本（用于 AI 分析）
   */
  private buildResumeText(resume: Resume): string {
    const parts: string[] = [];

    // 基本信息
    parts.push(`姓名：${resume.name}`);
    if (resume.gender) parts.push(`性别：${resume.gender}`);
    if (resume.age) parts.push(`年龄：${resume.age}`);
    parts.push(`联系方式：${resume.phone} / ${resume.email}`);

    // 工作年限
    if (resume.yearsOfExperience) {
      parts.push(`\n工作年限：${resume.yearsOfExperience}年`);
    }

    // 技能
    if (resume.skills && resume.skills.length > 0) {
      parts.push(`\n技能：${resume.skills.join('、')}`);
    }

    // 工作经历
    if (resume.experience && resume.experience.length > 0) {
      parts.push('\n工作经历：');
      resume.experience.forEach((exp) => {
        parts.push(
          `- ${exp.company} | ${exp.title} | ${exp.startDate} - ${exp.endDate}`,
        );
        if (exp.description) {
          parts.push(`  ${exp.description}`);
        }
      });
    }

    // 教育经历
    if (resume.education && resume.education.length > 0) {
      parts.push('\n教育背景：');
      resume.education.forEach((edu) => {
        parts.push(
          `- ${edu.school} | ${edu.degree}${edu.major ? ' | ' + edu.major : ''} | ${edu.startYear} - ${edu.endYear}`,
        );
      });
    }

    return parts.join('\n');
  }

  /**
   * 从 AI 分析的优势中提取匹配的关键词
   */
  private extractKeywordsFromStrengths(
    strengths: string[],
    resumeSkills: string[],
  ): string[] {
    const keywords: Set<string> = new Set();

    // 从简历技能中提取
    resumeSkills.forEach((skill) => {
      // 检查技能是否在优势描述中被提及
      const mentioned = strengths.some((strength) =>
        strength.toLowerCase().includes(skill.toLowerCase()),
      );
      if (mentioned) {
        keywords.add(skill);
      }
    });

    // 如果没有明确匹配，至少返回部分简历技能
    if (keywords.size === 0 && resumeSkills.length > 0) {
      resumeSkills.slice(0, 5).forEach((skill) => keywords.add(skill));
    }

    return Array.from(keywords);
  }

  /**
   * 从 AI 分析的不足中提取缺失的关键词
   */
  private extractKeywordsFromWeaknesses(
    weaknesses: string[],
    jobKeywords: string[],
  ): string[] {
    const keywords: Set<string> = new Set();

    // 从岗位要求中提取缺失的关键词
    jobKeywords.forEach((keyword) => {
      // 检查关键词是否在不足描述中被提及
      const mentioned = weaknesses.some((weakness) =>
        weakness.toLowerCase().includes(keyword.toLowerCase()),
      );
      if (mentioned) {
        keywords.add(keyword);
      }
    });

    return Array.from(keywords);
  }

  /**
   * 生成基于 AI 分析的匹配详情
   */
  private generateAiMatchDetails(
    score: number,
    analysis: string,
    strengths: string[],
    weaknesses: string[],
  ): string {
    const parts: string[] = [];

    parts.push(`【匹配度】${Math.round(score)}%`);
    parts.push('');
    parts.push(`【综合分析】`);
    parts.push(analysis);
    parts.push('');

    if (strengths.length > 0) {
      parts.push('【匹配优势】');
      strengths.forEach((strength, index) => {
        parts.push(`${index + 1}. ${strength}`);
      });
      parts.push('');
    }

    if (weaknesses.length > 0) {
      parts.push('【待提升项】');
      weaknesses.forEach((weakness, index) => {
        parts.push(`${index + 1}. ${weakness}`);
      });
    }

    return parts.join('\n');
  }

  /**
   * 为简历推荐岗位
   */
  async recommendJobsForResume(
    resumeId: number,
    limit: number = 5,
  ): Promise<MatchResult[]> {
    const resume = await this.resumesRepository.findOne({
      where: { id: resumeId, isDeleted: false },
    });

    if (!resume) {
      throw new Error('简历不存在');
    }

    // 获取所有开放的岗位
    const jobs = await this.jobsRepository.find({
      where: { status: JobStatus.OPEN, isDeleted: false },
    });

    // 计算所有岗位的匹配度
    const matches: MatchResult[] = [];
    for (const job of jobs) {
      const match = await this.calculateMatch(resumeId, job.id);
      matches.push(match);
    }

    // 按匹配度排序，返回前N个
    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 为岗位推荐候选人
   */
  async recommendResumesForJob(
    jobId: number,
    limit: number = 10,
  ): Promise<MatchResult[]> {
    const job = await this.jobsRepository.findOne({
      where: { id: jobId, isDeleted: false },
    });

    if (!job) {
      throw new Error('岗位不存在');
    }

    // 获取所有简历
    const resumes = await this.resumesRepository.find({
      where: { isDeleted: false },
    });

    // 计算所有简历的匹配度
    const matches: MatchResult[] = [];
    for (const resume of resumes) {
      const match = await this.calculateMatch(resume.id, jobId);
      matches.push(match);
    }

    // 按匹配度排序，返回前N个
    return matches.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * 获取匹配结果
   */
  async getMatchResult(resumeId: number, jobId: number): Promise<MatchResult> {
    let match = await this.matchResultsRepository.findOne({
      where: { resumeId, jobId },
      relations: ['resume', 'job'],
    });

    if (!match) {
      // 如果没有记录，实时计算
      match = await this.calculateMatch(resumeId, jobId);
      match = await this.matchResultsRepository.findOne({
        where: { resumeId, jobId },
        relations: ['resume', 'job'],
      });
    }

    return match;
  }

  /**
   * 批量计算匹配度
   */
  async batchCalculateMatches(
    resumeIds?: number[],
    jobIds?: number[],
  ): Promise<{ total: number; completed: number }> {
    const resumes = resumeIds
      ? await this.resumesRepository.findByIds(resumeIds)
      : await this.resumesRepository.find({ where: { isDeleted: false } });

    const jobs = jobIds
      ? await this.jobsRepository.findByIds(jobIds)
      : await this.jobsRepository.find({
          where: { status: JobStatus.OPEN, isDeleted: false },
        });

    const total = resumes.length * jobs.length;
    let completed = 0;

    for (const resume of resumes) {
      for (const job of jobs) {
        try {
          await this.calculateMatch(resume.id, job.id);
          completed++;
        } catch (error) {
          console.error(
            `计算匹配度失败: Resume ${resume.id} - Job ${job.id}`,
            error,
          );
        }
      }
    }

    return { total, completed };
  }

}

