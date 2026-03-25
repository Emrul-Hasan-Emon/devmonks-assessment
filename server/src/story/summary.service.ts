import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpClientService } from 'src/common/services/http-client.service';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { StoryDetailsResponseDto } from './dto/story-details-response.dto';
import { StorySummaryResponseDto } from './dto/story-summary-response.dto';
import { StoryService } from './story.service';
import { StorySummary } from 'src/database/postgres/entities/story-summary/story-summary.entity';
import { StorySummarySentimentEnum } from 'src/database/enums/story-summary.enum';

@Injectable()
export class SummaryService {
  private HN_URL: string;
  private OPENAI_URL: string;
  private OPENAI_API_KEY: string;
  private OPENAI_MODEL: string;
  private logger = new Logger(SummaryService.name);

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly postgresService: PostgresService,
    private readonly configService: ConfigService,
    private readonly storyService: StoryService,
  ) {
    this.HN_URL = this.configService.get<string>('HN_URL');
    this.OPENAI_URL = this.configService.get<string>('OPENAI_URL');
    this.OPENAI_API_KEY = this.configService.get<string>('OPENAI_API_KEY');
    this.OPENAI_MODEL = this.configService.get<string>('OPENAI_MODEL');

    if (!this.HN_URL) {
      this.logger.warn(
        'HN_URL is not configured. Story summarization will not work.',
      );
    }
    if (!this.OPENAI_API_KEY) {
      this.logger.warn(
        'OPENAI_API_KEY is not configured. Story summarization will not work.',
      );
    }
    if (!this.OPENAI_MODEL) {
      this.logger.warn(
        'OPENAI_MODEL is not configured. Story summarization will not work.',
      );
    }
  }

  async summarizeStoryComments(
    storyId: number,
  ): Promise<StorySummaryResponseDto> {
    this.logger.debug(`Summarizing comments for story ID: ${storyId}`);

    if (!this.OPENAI_API_KEY) {
      throw new BadRequestException('OpenAI API key is not configured');
    }

    // Fetch complete story with nested comments & check if summary already exists in DB
    const [story, existingSummary] = await Promise.all([
      this.storyService.getStoryDetail(storyId),
      this.postgresService.storySummary.findOne({ where: { storyId } }),
    ]);

    if (!story) {
      throw new BadRequestException(`Story ${storyId} not found`);
    }

    // Count comments
    const commentCount = this.countComments(story.comments || []);
    this.logger.debug(`Story ${storyId} has ${commentCount} comments`);

    // If present and comment count matches, return cached summary
    if (existingSummary && existingSummary.lastCommentCount === commentCount) {
      this.logger.debug(`Using cached summary for story ${storyId}`);
      return this.mapStorySummaryToResponse(existingSummary);
    }

    this.logger.debug(`Generating new summary for story ${storyId}`);

    // Generate summary using OpenAI
    const aiResponse = await this.generateSummaryWithOpenAI(
      story,
      commentCount,
    );

    // Store or update in DB
    const summaryData = {
      storyId,
      summary: aiResponse.summary,
      keyPoints: aiResponse.keyPoints,
      sentiment: aiResponse.sentiment,
      model: this.OPENAI_MODEL,
      tokensUsed: aiResponse.tokensUsed,
      lastCommentCount: commentCount,
      status: 'ready',
    };

    console.log('Summary data to save:', summaryData);
    console.log('Existing summary in DB:', existingSummary);

    let savedSummary;
    if (existingSummary) {
      await this.postgresService.storySummary.update(
        existingSummary.id,
        summaryData,
      );
      savedSummary = await this.postgresService.storySummary.findOne({
        where: { storyId },
      });
    } else {
      // persist the new summary record to the database
      savedSummary = await this.postgresService.storySummary.save(summaryData);
    }

    console.log('Saved summary in DB:', savedSummary);
    this.logger.debug(`Summary saved for story ${storyId}`);

    const response = this.mapStorySummaryToResponse(savedSummary);
    response.keyPoints = aiResponse.keyPoints;
    response.sentiment = aiResponse.sentiment;

    return response;
  }

  private async fetchStoryWithComments(
    storyId: number,
  ): Promise<StoryDetailsResponseDto> {
    const url = `${this.HN_URL}/v0/item/${storyId}.json?print=pretty`;
    const story = await this.httpClientService.get<any>(url);

    if (!story) {
      throw new BadRequestException(`Story ${storyId} not found`);
    }

    const storyDetail: StoryDetailsResponseDto = {
      by: story.by,
      id: story.id,
      title: story.title,
      text: story.text,
      time: story.time,
      type: story.type,
      score: story.score,
      url: story.url,
      descendants: story.descendants,
    };

    if (story.kids && story.kids.length > 0) {
      storyDetail.comments = (
        await Promise.all(
          story.kids.map((commentId: number) =>
            this.buildCommentTree(commentId),
          ),
        )
      ).filter((c) => c !== null);
    }

    return storyDetail;
  }

  private async buildCommentTree(commentId: number): Promise<any> {
    try {
      const commentUrl = `${this.HN_URL}/v0/item/${commentId}.json?print=pretty`;
      const comment = await this.httpClientService.get<any>(commentUrl);

      const commentDto: any = {
        by: comment.by,
        id: comment.id,
        text: comment.text,
        time: comment.time,
        type: comment.type,
        score: comment.score,
        parent: comment.parent,
      };

      if (comment.kids && comment.kids.length > 0) {
        commentDto.comments = (
          await Promise.all(
            comment.kids.map((replyId: number) =>
              this.buildCommentTree(replyId),
            ),
          )
        ).filter((c) => c !== null);
      }

      return commentDto;
    } catch (error) {
      return null;
    }
  }

  private countComments(comments: any[]): number {
    if (!comments || comments.length === 0) return 0;

    let count = comments.length;
    for (const comment of comments) {
      if (comment.comments) {
        count += this.countComments(comment.comments);
      }
    }
    return count;
  }

  private flattenComments(comments: any[]): string {
    if (!comments || comments.length === 0) return '';

    let flattened = '';
    const queue: any[] = [...comments];

    while (queue.length > 0) {
      // Pop current level size before processing
      const currentLevelSize = queue.length;
      const currentLevel: any[] = [];

      // Pop comments from queue at current level
      for (let i = 0; i < currentLevelSize; i++) {
        currentLevel.push(queue.shift()); // Pop from front
      }

      // Sort current level by score
      const sorted = currentLevel.sort(
        (a, b) => (b.score || 0) - (a.score || 0),
      );

      // Add sorted comments and push their children to queue
      for (const comment of sorted) {
        if (comment.text) {
          flattened += `${comment.text}\n\n`;
        }
        // Push nested comments to back of queue (for next level)
        if (comment.comments && comment.comments.length > 0) {
          queue.push(...comment.comments);
        }
      }
    }

    return flattened;
  }

  private async generateSummaryWithOpenAI(
    story: StoryDetailsResponseDto,
    commentCount: number,
  ): Promise<{
    summary: string;
    keyPoints: string[];
    sentiment: StorySummarySentimentEnum;
    tokensUsed: number;
  }> {
    const commentsText = this.flattenComments(story.comments || []);

    if (!commentsText.trim()) {
      return {
        summary: 'No comments to summarize.',
        keyPoints: [],
        sentiment: StorySummarySentimentEnum.NEUTRAL,
        tokensUsed: 0,
      };
    }

    const systemPrompt = this.getSystemPrompt();
    const userPrompt = this.getUserPrompt(story);

    try {
      const response = await this.httpClientService.post<any>(
        `${this.OPENAI_URL}/v1/chat/completions`,
        {
          model: this.OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      );

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);

      return {
        summary: parsed.summary || 'Unable to generate summary',
        keyPoints: parsed.keyPoints || [],
        sentiment: parsed.sentiment || StorySummarySentimentEnum.NEUTRAL,
        tokensUsed: response.usage?.total_tokens || 0,
      };
    } catch (error) {
      this.logger.error(`Error calling OpenAI API: ${error.message}`);
      throw new BadRequestException('Failed to generate summary using AI');
    }
  }

  private mapStorySummaryToResponse(
    summary: StorySummary,
  ): StorySummaryResponseDto {
    return {
      storyId: summary.storyId,
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      sentiment: summary.sentiment as StorySummarySentimentEnum,
      commentCount: summary.lastCommentCount,
      model: summary.model,
      tokensUsed: summary.tokensUsed || 0,
      timestamp: summary.updatedAt,
    };
  }

  private getSystemPrompt(): string {
    return `You are an expert discussion summarizer. Analyze the provided comments and generate:
        1. A concise summary (2-3 sentences)
        2. Key points (3-5 bullet points)
        3. Overall sentiment (select one: positive, negative, mixed, neutral)
    Format your response as JSON with these fields: summary, keyPoints (array of strings), sentiment`;
  }

  private getUserPrompt(story: StoryDetailsResponseDto): string {
    return `Summarize this discussion thread:\n\n${this.flattenComments(story.comments || []).substring(0, 4000)}`;
  }
}
