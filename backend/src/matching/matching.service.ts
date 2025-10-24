import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MatchResult } from './entities/match-result.entity';
import { Job, JobStatus } from '../jobs/entities/job.entity';
import { Resume } from '../resumes/entities/resume.entity';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(MatchResult)
    private matchResultsRepository: Repository<MatchResult>,
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(Resume)
    private resumesRepository: Repository<Resume>,
  ) {}

  /**
   * 计算简历与岗位的匹配度
   * 基于技能关键词的Jaccard相似度
   */
  async calculateMatch(resumeId: number, jobId: number): Promise<MatchResult> {
    const resume = await this.resumesRepository.findOne({
      where: { id: resumeId, isDeleted: false },
    });
    const job = await this.jobsRepository.findOne({
      where: { id: jobId, isDeleted: false },
    });

    if (!resume || !job) {
      throw new Error('简历或岗位不存在');
    }

    // 获取简历技能和岗位要求的关键词
    const resumeSkills = new Set(
      (resume.skills || []).map((s) => s.toLowerCase()),
    );
    const jobKeywords = new Set(
      (job.skillKeywords || []).map((s) => s.toLowerCase()),
    );

    // 如果岗位没有设置关键词，从requirements字段提取
    if (jobKeywords.size === 0 && job.requirements) {
      const extractedKeywords = this.extractKeywords(job.requirements);
      extractedKeywords.forEach((k) => jobKeywords.add(k));
    }

    // 计算交集和并集
    const matchedKeywords = Array.from(resumeSkills).filter((skill) =>
      jobKeywords.has(skill),
    );
    const allKeywords = new Set([...resumeSkills, ...jobKeywords]);

    // Jaccard相似度
    const score =
      allKeywords.size > 0
        ? (matchedKeywords.length / allKeywords.size) * 100
        : 0;

    // 找出缺失的关键词
    const missingKeywords = Array.from(jobKeywords).filter(
      (keyword) => !resumeSkills.has(keyword),
    );

    // 检查是否已存在匹配记录
    let matchResult = await this.matchResultsRepository.findOne({
      where: { resumeId, jobId },
    });

    if (matchResult) {
      // 更新现有记录
      matchResult.score = Math.round(score * 10) / 10;
      matchResult.matchedKeywords = matchedKeywords;
      matchResult.missingKeywords = missingKeywords;
      matchResult.details = this.generateMatchDetails(
        matchedKeywords,
        missingKeywords,
        score,
      );
    } else {
      // 创建新记录
      matchResult = this.matchResultsRepository.create({
        resumeId,
        jobId,
        score: Math.round(score * 10) / 10,
        matchedKeywords,
        missingKeywords,
        details: this.generateMatchDetails(
          matchedKeywords,
          missingKeywords,
          score,
        ),
      });
    }

    return await this.matchResultsRepository.save(matchResult);
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

  /**
   * 从文本中提取关键词（简单实现）
   */
  private extractKeywords(text: string): string[] {
    // 常见技能关键词列表（可扩展）
    const commonSkills = [
      'java',
      'python',
      'javascript',
      'typescript',
      'react',
      'vue',
      'angular',
      'node.js',
      'spring',
      'springboot',
      'mysql',
      'redis',
      'mongodb',
      'docker',
      'kubernetes',
      'git',
      'linux',
      'aws',
      'azure',
      'go',
      'rust',
      'c++',
      'php',
      'ruby',
    ];

    const lowerText = text.toLowerCase();
    return commonSkills.filter((skill) => lowerText.includes(skill));
  }

  /**
   * 生成匹配详情说明
   */
  private generateMatchDetails(
    matched: string[],
    missing: string[],
    score: number,
  ): string {
    let details = `匹配度：${Math.round(score)}%\n\n`;

    if (matched.length > 0) {
      details += `匹配的技能：${matched.join('、')}\n\n`;
    }

    if (missing.length > 0) {
      details += `缺失的技能：${missing.join('、')}`;
    }

    return details;
  }
}

