import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as pdf from 'pdf-parse';
import * as mammoth from 'mammoth';

export interface ParsedResume {
  name: string;
  phone: string;
  email: string;
  gender?: string;
  age?: number;
  skills: string[];
  experience: Array<{
    company: string;
    title: string;
    startDate: string;
    endDate: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    major?: string;
    startYear: number;
    endYear: number;
  }>;
  yearsOfExperience?: number;
  summary?: string;
}

export interface MultiResumeDetection {
  isMultiple: boolean;
  count: number;
  resumes: ParsedResume[];
}

export interface GeneratedQuestion {
  title: string;
  description: string;
  type: 'programming' | 'qa' | 'behavioral' | 'technical_qa';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  standardAnswer?: string;
  answerPoints?: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openai: OpenAI;

  constructor() {
    const apiKey = process.env.DEEPSEEK_API_KEY || 'sk-091d9b5b2cad452a9f018fd8fdd683d9';
    
    if (!process.env.DEEPSEEK_API_KEY) {
      this.logger.warn('DEEPSEEK_API_KEY 未在环境变量中设置，使用默认密钥');
    }

    this.openai = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      // baseURL: "http://22.50.21.17:8099/v1",
      apiKey: apiKey,
      // apiKey: "gpustack_f2f3b18914e33029_1bcfa64dfda2b1ae428a831c6b731029"
    });
  }

  /**
   * 从文件中提取文本内容
   */
  private async extractTextFromFile(filePath: string): Promise<string> {
    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      const ext = filePath.split('.').pop()?.toLowerCase();
      this.logger.log(`正在提取文件内容，格式: ${ext}`);

      if (ext === 'pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        
        // 即使文本为空也返回，不抛出错误
        // 让上层决定如何处理
        const extractedText = data.text || '';
        
        if (!extractedText || extractedText.trim().length === 0) {
          this.logger.warn('PDF 文本提取结果为空，可能是扫描件');
          return ''; // 返回空字符串，不抛出错误
        }
        
        this.logger.log(`成功提取 PDF 文本，长度: ${extractedText.length} 字符`);
        return extractedText;
      } else if (ext === 'txt') {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (!content || content.trim().length === 0) {
          throw new Error('TXT 文件内容为空');
        }
        
        return content;
      } else if (ext === 'json') {
        const content = fs.readFileSync(filePath, 'utf-8');
        const jsonData = JSON.parse(content);
        return JSON.stringify(jsonData, null, 2);
      } else if (ext === 'docx') {
        // DOCX 格式 - 使用 mammoth 提取文本
        this.logger.log('正在提取 DOCX 文件内容...');
        const result = await mammoth.extractRawText({ path: filePath });
        const extractedText = result.value || '';
        
        if (!extractedText || extractedText.trim().length === 0) {
          this.logger.warn('DOCX 文本提取结果为空');
          throw new Error('DOCX 文件内容为空或无法提取文本');
        }
        
        this.logger.log(`成功提取 DOCX 文本，长度: ${extractedText.length} 字符`);
        return extractedText;
      } else if (ext === 'doc') {
        // DOC 格式（旧格式）- 建议转换
        this.logger.warn('检测到旧版 DOC 格式，建议转换为 DOCX 或 PDF');
        throw new Error('暂不支持旧版 DOC 格式，请将文件转换为 DOCX 或 PDF 后重新上传。\n提示：可使用 Microsoft Word 或 WPS 打开后另存为 DOCX 格式。');
      } else {
        throw new Error(`不支持的文件格式: ${ext}`);
      }
    } catch (error) {
      this.logger.error(`提取文件文本失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 将 PDF 文件转换为 base64
   */
  private async pdfToBase64(filePath: string): Promise<string> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return fileBuffer.toString('base64');
    } catch (error) {
      this.logger.error(`PDF 转 base64 失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析简历文件 - 直接发送 PDF 给 AI 分析
   */
  async parseResume(filePath: string): Promise<ParsedResume> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`开始解析简历文件: ${filePath}`);

      const ext = filePath.split('.').pop()?.toLowerCase();
      let text = '';
      let usePdfDirect = false;

      // 步骤1: 尝试提取文本内容
      try {
        text = await this.extractTextFromFile(filePath);
        
        if (!text || text.trim().length < 10) {
          this.logger.warn('文本提取内容过短，将尝试直接发送 PDF 给 AI 分析');
          usePdfDirect = true;
        } else {
          this.logger.log(`文本提取成功，长度: ${text.length} 字符`);
        }
      } catch (extractError) {
        this.logger.warn(`文本提取失败: ${extractError.message}，将尝试直接发送 PDF 给 AI 分析`);
        usePdfDirect = true;
      }

      // 步骤2: 调用 AI 解析
      let parsed: ParsedResume;

      if (ext === 'pdf' && usePdfDirect) {
        // PDF 文本提取失败，直接发送 PDF 文件给 AI（可能是扫描件）
        this.logger.log('使用 PDF 文件直接分析模式（适用于扫描件/图片 PDF）');
        parsed = await this.parseResumeFromPdfFile(filePath);
      } else {
        // 使用提取的文本进行分析
        this.logger.log('使用文本分析模式');
        parsed = await this.parseResumeFromText(text);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`简历解析成功: ${parsed.name}，耗时: ${duration}ms`);

      return parsed;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`解析简历失败（耗时: ${duration}ms）: ${error.message}`);
      
      // 提供更详细的错误信息
      if (error.message.includes('API')) {
        throw new Error(`AI服务调用失败: ${error.message}`);
      } else if (error.message.includes('JSON')) {
        throw new Error(`AI返回的数据格式错误，请重试`);
      } else if (error.message.includes('文件')) {
        throw new Error(`文件处理失败: ${error.message}`);
      } else {
        throw new Error(`解析失败: ${error.message}`);
      }
    }
  }

  /**
   * 从文本内容解析简历（使用 AI）
   */
  private async parseResumeFromText(text: string): Promise<ParsedResume> {
    const completion = await this.openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个专业的简历解析助手。请从提供的简历文本中提取以下信息，并以JSON格式返回：
{
  "name": "姓名",
  "phone": "手机号（格式：13800138000，只保留数字）",
  "email": "邮箱",
  "gender": "性别（男/女，如果有）",
  "age": 年龄数字（如果有）,
  "skills": ["技能1", "技能2", ...],
  "experience": [
    {
      "company": "公司名称",
      "title": "职位",
      "startDate": "开始时间（YYYY-MM格式）",
      "endDate": "结束时间（YYYY-MM格式或'至今'）",
      "description": "工作描述"
    }
  ],
  "education": [
    {
      "school": "学校名称",
      "degree": "学历（本科/硕士/博士等）",
      "major": "专业",
      "startYear": 开始年份,
      "endYear": 结束年份
    }
  ],
  "yearsOfExperience": 总工作年限数字,
  "summary": "个人简介或自我评价"
}

重要规则：
1. 如果某些字段在简历中找不到，请设置为null或空数组
2. 手机号必须是11位数字，去除所有空格、横线等符号
3. 邮箱格式必须正确
4. 技能列表应该提取所有提到的技术、工具、编程语言、框架等
5. 工作经历按时间倒序排列（最近的在前）
6. 只返回JSON对象，不要包含任何其他文字或标记
7. 确保所有字段名称和JSON格式严格正确`,
        },
        {
          role: 'user',
          content: `请解析以下简历内容：\n\n${text}`,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0].message.content;
    
    if (!result) {
      throw new Error('AI 返回结果为空');
    }

    const parsed = JSON.parse(result);

    // 验证和清洗数据
    return this.validateAndCleanResumeData(parsed);
  }

  /**
   * 从 PDF 文件直接解析简历（适用于扫描件/图片 PDF）
   */
  private async parseResumeFromPdfFile(filePath: string): Promise<ParsedResume> {
    this.logger.log('尝试直接分析 PDF 文件（可能是扫描件）');

    try {
      // 方案1: 再次尝试提取 PDF 中的任何文本（即使很少）
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      let content = data.text || '';
      
      if (content.trim().length === 0) {
        // PDF 完全没有文本（可能是纯图片/扫描件）
        this.logger.warn('PDF 是纯图片格式（扫描件）');
        
        // 方案2: 检查是否启用 OCR
        if (process.env.ENABLE_OCR === 'true') {
          this.logger.log('OCR 功能已启用，尝试识别...');
          try {
            // TODO: 集成 OCR 服务
            // const ocrService = new OcrService();
            // content = await ocrService.extractTextFromImage(filePath);
            
            // 暂时返回一个友好的消息，而不是抛出错误
            this.logger.warn('OCR 功能未完全实现，建议手动录入或使用文本 PDF');
            
            // 返回一个带有提示的简历数据，而不是完全失败
            return {
              name: '待手动录入',
              phone: '00000000000',
              email: 'pending@example.com',
              skills: [],
              experience: [],
              education: [],
              summary: '此简历为扫描件，OCR 功能待集成。请手动录入或重新上传文本格式 PDF。',
            };
          } catch (ocrError) {
            this.logger.error(`OCR 识别失败: ${ocrError.message}`);
            // 不抛出错误，返回待录入状态
            return {
              name: '待手动录入',
              phone: '00000000000',
              email: 'pending@example.com',
              skills: [],
              experience: [],
              education: [],
              summary: `OCR 识别失败: ${ocrError.message}。请手动录入简历信息。`,
            };
          }
        } else {
          // 未启用 OCR，但不抛出错误，返回待录入状态
          this.logger.warn('OCR 功能未启用，简历需要手动录入');
          return {
            name: '待手动录入（扫描件）',
            phone: '00000000000',
            email: 'pending@example.com',
            skills: [],
            experience: [],
            education: [],
            summary: 'PDF 为扫描件，无法自动提取文本。请手动编辑录入简历信息，或重新上传文本格式的 PDF。',
          };
        }
      }

      // 即使文本很少，也让 AI 尝试分析
      this.logger.log(`提取到文本（${content.length} 字符），交给 AI 分析...`);
      return await this.parseResumeFromText(content);
      
    } catch (error) {
      this.logger.error(`PDF 文件直接分析失败: ${error.message}`);
      
      // 即使出错，也返回一个可编辑的状态，而不是完全失败
      return {
        name: '待手动录入',
        phone: '00000000000',
        email: 'pending@example.com',
        skills: [],
        experience: [],
        education: [],
        summary: `解析失败: ${error.message}。请手动编辑录入简历信息。`,
      };
    }
  }

  /**
   * 验证和清洗简历数据
   */
  private validateAndCleanResumeData(parsed: any): ParsedResume {
    // 验证必填字段（放宽要求，允许待手动录入）
    if (!parsed.name || parsed.name === '待解析') {
      // 如果是扫描件或待录入状态，不抛出错误
      if (parsed.name === '待手动录入' || parsed.name === '待手动录入（扫描件）') {
        this.logger.warn('简历需要手动录入，已返回待编辑状态');
      } else {
        this.logger.warn('无法提取姓名信息，建议检查简历格式或手动编辑');
      }
    }

    if (!parsed.phone || parsed.phone.length < 11) {
      this.logger.warn('手机号格式可能不正确');
    }

    if (!parsed.email || !parsed.email.includes('@')) {
      this.logger.warn('邮箱格式可能不正确');
    }

    // 确保数组字段不为 null
    parsed.skills = parsed.skills || [];
    parsed.experience = parsed.experience || [];
    parsed.education = parsed.education || [];

    return parsed;
  }

  /**
   * 从简历文本中提取关键词
   */
  async extractKeywordsFromResume(resumeText: string): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个关键词提取专家。请从简历中提取最重要的技能关键词，返回JSON数组格式：
["关键词1", "关键词2", ...]

要求：
1. 只提取技术、工具、框架、编程语言等硬技能
2. 每个关键词尽量简短（1-3个词）
3. 关键词应该是常见的行业术语
4. 最多返回20个关键词
5. 只返回JSON数组，不要包含其他文字`,
          },
          {
            role: 'user',
            content: resumeText,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      return parsed.keywords || [];
    } catch (error) {
      this.logger.error(`提取关键词失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 从岗位描述中提取关键词
   */
  async extractKeywordsFromJob(
    jobTitle: string,
    requirements: string,
  ): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个关键词提取专家。请从岗位要求中提取最重要的技能关键词，返回JSON数组格式：
["关键词1", "关键词2", ...]

要求：
1. 只提取技术、工具、框架、编程语言等硬技能要求
2. 每个关键词尽量简短（1-3个词）
3. 关键词应该是常见的行业术语
4. 最多返回15个关键词
5. 只返回JSON数组，不要包含其他文字`,
          },
          {
            role: 'user',
            content: `岗位：${jobTitle}\n\n任职要求：\n${requirements}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      return parsed.keywords || [];
    } catch (error) {
      this.logger.error(`提取岗位关键词失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 为题目生成标签
   */
  async generateQuestionTags(
    title: string,
    description: string,
  ): Promise<string[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个面试题目分类专家。请为题目生成合适的标签，返回JSON数组格式：
["标签1", "标签2", ...]

标签类型包括：
- 技术领域：前端、后端、算法、数据库、系统设计等
- 具体技术：React、Java、Python、MySQL、Redis等
- 题目类型：编程题、问答题、行为面试、场景题等
- 难度相关：基础、进阶、架构等

要求：
1. 生成3-5个标签
2. 标签应该简短且准确
3. 只返回JSON数组，不要包含其他文字`,
          },
          {
            role: 'user',
            content: `题目：${title}\n\n描述：${description}`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      return parsed.tags || [];
    } catch (error) {
      this.logger.error(`生成题目标签失败: ${error.message}`);
      return [];
    }
  }

  /**
   * AI生成面试题目
   */
  async generateInterviewQuestions(
    jobTitle: string,
    requirements: string,
    count: number = 5,
  ): Promise<GeneratedQuestion[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的面试官。请根据岗位要求生成${count}道面试题目，返回JSON数组格式：
[
  {
    "title": "题目标题",
    "description": "题目描述（编程题包含输入输出示例，问答题包含问题详情）",
    "type": "题目类型（programming/qa/behavioral/technical_qa）",
    "difficulty": "难度（easy/medium/hard）",
    "tags": ["标签1", "标签2"],
    "standardAnswer": "标准答案或答题思路",
    "answerPoints": ["答题要点1", "答题要点2", ...]
  }
]

要求：
1. 题目应该与岗位要求紧密相关
2. 包含不同类型和难度的题目
3. 编程题要有清晰的输入输出示例
4. 问答题要有参考答案
5. 只返回JSON数组，不要包含其他文字`,
          },
          {
            role: 'user',
            content: `岗位：${jobTitle}\n\n任职要求：\n${requirements}\n\n请生成${count}道面试题。`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      return parsed.questions || [];
    } catch (error) {
      this.logger.error(`生成面试题目失败: ${error.message}`);
      throw new Error(`AI生成题目失败: ${error.message}`);
    }
  }

  /**
   * 根据岗位推荐题目（从现有题库中）
   */
  async recommendQuestionsForJob(
    jobTitle: string,
    requirements: string,
    availableQuestions: Array<{
      id: number;
      title: string;
      description: string;
      tags: string[];
    }>,
    limit: number = 10,
  ): Promise<number[]> {
    try {
      const questionsDesc = availableQuestions
        .map(
          (q) =>
            `ID: ${q.id}\n标题: ${q.title}\n标签: ${q.tags.join(', ')}\n描述: ${q.description.substring(0, 100)}...`,
        )
        .join('\n\n---\n\n');

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个面试题目推荐专家。请根据岗位要求，从提供的题库中推荐最合适的${limit}道题目。
返回JSON格式：
{
  "questionIds": [题目ID1, 题目ID2, ...],
  "reason": "推荐理由"
}

要求：
1. 选择与岗位要求最相关的题目
2. 考虑题目的标签和描述
3. 确保题目ID在提供的列表中
4. 最多推荐${limit}道题目
5. 只返回JSON，不要包含其他文字`,
          },
          {
            role: 'user',
            content: `岗位：${jobTitle}\n\n任职要求：\n${requirements}\n\n可选题目列表：\n${questionsDesc}`,
          },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      this.logger.log(`推荐理由: ${parsed.reason}`);
      return parsed.questionIds || [];
    } catch (error) {
      this.logger.error(`推荐题目失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 增强的岗位匹配度计算（使用AI分析）
   */
  async calculateMatchScore(
    resumeText: string,
    jobTitle: string,
    jobRequirements: string,
  ): Promise<{
    score: number;
    analysis: string;
    strengths: string[];
    weaknesses: string[];
  }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的HR助手。请分析候选人简历与岗位要求的匹配度，返回JSON格式：
{
  "score": 匹配度分数（0-100的整数）,
  "analysis": "详细分析（200字以内）",
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2", "不足3"]
}

评分标准：
- 90-100: 完全匹配，技能和经验都非常符合
- 75-89: 高度匹配，核心技能符合
- 60-74: 中等匹配，部分技能符合
- 40-59: 低度匹配，较少技能符合
- 0-39: 不匹配

只返回JSON，不要包含其他文字`,
          },
          {
            role: 'user',
            content: `岗位：${jobTitle}\n\n岗位要求：\n${jobRequirements}\n\n候选人简历：\n${resumeText}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);
      return {
        score: parsed.score || 0,
        analysis: parsed.analysis || '',
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
      };
    } catch (error) {
      this.logger.error(`AI匹配度计算失败: ${error.message}`);
      throw new Error(`AI分析失败: ${error.message}`);
    }
  }

  /**
   * 检测并解析文件中的多个简历
   * 识别一个文件中是否包含多个人的简历，并拆分解析
   */
  async detectAndParseMultipleResumes(
    filePath: string,
  ): Promise<MultiResumeDetection> {
    const startTime = Date.now();

    try {
      this.logger.log(`开始检测文件中的简历数量: ${filePath}`);

      // 第1步: 提取文件文本
      const text = await this.extractTextFromFile(filePath);

      if (!text || text.trim().length < 50) {
        this.logger.warn('文件内容过短，按单个简历处理');
        return {
          isMultiple: false,
          count: 1,
          resumes: [],
        };
      }

      // 第2步: 使用 AI 检测是否包含多个简历
      const detection = await this.detectMultipleResumesInText(text);

      if (!detection.isMultiple || detection.count <= 1) {
        // 单个简历，使用原有解析方法
        this.logger.log('检测到单个简历');
        const singleResume = await this.parseResume(filePath);
        return {
          isMultiple: false,
          count: 1,
          resumes: [singleResume],
        };
      }

      // 第3步: 多个简历，使用 AI 拆分并解析
      this.logger.log(`检测到 ${detection.count} 个简历，开始拆分解析...`);
      const resumes = await this.parseMultipleResumesFromText(text);

      const duration = Date.now() - startTime;
      this.logger.log(
        `多简历解析完成: 共 ${resumes.length} 个，耗时: ${duration}ms`,
      );

      return {
        isMultiple: true,
        count: resumes.length,
        resumes,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `多简历检测失败 (耗时: ${duration}ms): ${error.message}`,
      );

      // 失败时尝试按单个简历处理
      try {
        this.logger.log('尝试按单个简历处理...');
        const singleResume = await this.parseResume(filePath);
        return {
          isMultiple: false,
          count: 1,
          resumes: [singleResume],
        };
      } catch (fallbackError) {
        throw new Error(
          `简历解析失败: ${error.message}`,
        );
      }
    }
  }

  /**
   * 使用 AI 检测文本中是否包含多个简历
   */
  private async detectMultipleResumesInText(
    text: string,
  ): Promise<{ isMultiple: boolean; count: number }> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个简历识别专家。请判断提供的文本中包含多少份简历。

判断标准：
1. 每份简历通常包含：姓名、联系方式（手机/邮箱）、工作经历、教育背景
2. 如果有多个不同的姓名和联系方式，可能是多份简历
3. 注意区分同一人的多次工作经历和不同人的简历

返回 JSON 格式：
{
  "isMultiple": true/false,
  "count": 简历数量（整数）,
  "reason": "判断理由"
}

只返回 JSON，不要包含其他文字。`,
          },
          {
            role: 'user',
            content: `请分析以下文本包含多少份简历：\n\n${text.substring(0, 4000)}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);

      this.logger.log(
        `AI 检测结果: ${parsed.isMultiple ? '多份简历' : '单份简历'}, 数量: ${parsed.count}, 理由: ${parsed.reason}`,
      );

      return {
        isMultiple: parsed.isMultiple || false,
        count: parsed.count || 1,
      };
    } catch (error) {
      this.logger.error(`AI 检测简历数量失败: ${error.message}`);
      // 失败时默认按单个简历处理
      return {
        isMultiple: false,
        count: 1,
      };
    }
  }

  /**
   * 从文本中解析多个简历
   */
  private async parseMultipleResumesFromText(
    text: string,
  ): Promise<ParsedResume[]> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个专业的简历解析助手。文本中包含多份简历，请将每份简历分别提取出来。

返回 JSON 格式：
{
  "resumes": [
    {
      "name": "姓名",
      "phone": "手机号（格式：13800138000）",
      "email": "邮箱",
      "gender": "性别（男/女）",
      "age": 年龄,
      "skills": ["技能1", "技能2"],
      "experience": [
        {
          "company": "公司",
          "title": "职位",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM或至今",
          "description": "描述"
        }
      ],
      "education": [
        {
          "school": "学校",
          "degree": "学历",
          "major": "专业",
          "startYear": 年份,
          "endYear": 年份
        }
      ],
      "yearsOfExperience": 工作年限,
      "summary": "个人简介"
    }
  ]
}

重要：
1. resumes 数组中每个元素是一份独立的简历
2. 确保每份简历都有姓名和联系方式
3. 如果某些字段找不到，设置为 null 或空数组
4. 只返回 JSON，不要其他文字`,
          },
          {
            role: 'user',
            content: `请解析以下多份简历：\n\n${text}`,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const result = completion.choices[0].message.content;
      const parsed = JSON.parse(result);

      if (!parsed.resumes || !Array.isArray(parsed.resumes)) {
        throw new Error('AI 返回的简历数组格式错误');
      }

      // 验证和清洗每份简历数据
      const validatedResumes: ParsedResume[] = [];
      for (const resume of parsed.resumes) {
        try {
          const validated = this.validateAndCleanResumeData(resume);
          validatedResumes.push(validated);
        } catch (error) {
          this.logger.warn(`跳过无效简历: ${error.message}`);
        }
      }

      if (validatedResumes.length === 0) {
        throw new Error('没有解析出有效的简历');
      }

      this.logger.log(`成功解析 ${validatedResumes.length} 份简历`);
      return validatedResumes;
    } catch (error) {
      this.logger.error(`解析多份简历失败: ${error.message}`);
      throw error;
    }
  }
}

