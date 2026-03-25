import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SearchPagination,
  getSearchPaginateData,
} from 'src/common/decorator/pagination.decorator';
import { HttpClientService } from 'src/common/services/http-client.service';
import { StoryItemDto } from './dto/stories-list-response.dto';
import {
  StoryDetailsResponseDto,
  StoryCommentResponseDto,
} from './dto/story-details-response.dto';

enum STORY_TYPE {
    TOP = 'topstories',
    BEST = 'beststories',
    NEW = 'newstories',
}

@Injectable()
export class StoryService {
  private HN_URL: string;
  private logger = new Logger(StoryService.name);
  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService,
  ) {
    this.HN_URL = this.configService.get<string>('HN_URL');
  }

  /**
   * Fetches top stories from Hacker News, paginates the results, and returns them without the 'kids' property.
   * The 'kids' property is removed to optimize the response size, as it can contain a large number of comment IDs.
   * The method also handles pagination logic based on the provided SearchPagination parameters.
   */
  async getTopStories(pagination: SearchPagination) {
    this.logger.debug(`Fetching top stories with pagination: ${JSON.stringify(pagination)}`);
    const topStoryIds = await this.getStoriesIds(pagination, STORY_TYPE.TOP);
    const paginatedIds = topStoryIds.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    let stories = await Promise.all(
      paginatedIds.map((id) =>
        this.httpClientService.get<StoryItemDto>(
          `${this.HN_URL}/v0/item/${id}.json?print=pretty`,
        ),
      ),
    );

    // Remove Kids Property
    stories = stories.map((story) => {
      const { kids, ...rest } = story;
      return rest;
    });

    this.logger.debug(`Fetched ${stories.length} top stories for pagination: ${JSON.stringify(pagination)}`);
    return getSearchPaginateData(stories, topStoryIds.length, pagination);
  }

  /**
   * Fetches best stories from Hacker News, paginates the results, and returns them without the 'kids' property.
   */
  async getBestStories(pagination: SearchPagination) {
    this.logger.debug(`Fetching best stories with pagination: ${JSON.stringify(pagination)}`);
    const bestStoryIds = await this.getStoriesIds(pagination, STORY_TYPE.BEST);
    const paginatedIds = bestStoryIds.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    let stories = await Promise.all(
      paginatedIds.map((id) =>
        this.httpClientService.get<StoryItemDto>(
          `${this.HN_URL}/v0/item/${id}.json?print=pretty`,
        ),
      ),
    );

    // Remove Kids Property
    stories = stories.map((story) => {
      const { kids, ...rest } = story;
      return rest;
    });

    this.logger.debug(`Fetched ${stories.length} best stories for pagination: ${JSON.stringify(pagination)}`);
    return getSearchPaginateData(stories, bestStoryIds.length, pagination);
  }

  /**
   * Fetches new stories from Hacker News, paginates the results, and returns them without the 'kids' property.
   */
  async getNewStories(pagination: SearchPagination) {
    this.logger.debug(`Fetching new stories with pagination: ${JSON.stringify(pagination)}`);
    const newStoryIds = await this.getStoriesIds(pagination, STORY_TYPE.NEW);
    const paginatedIds = newStoryIds.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    let stories = await Promise.all(
      paginatedIds.map((id) =>
        this.httpClientService.get<StoryItemDto>(
          `${this.HN_URL}/v0/item/${id}.json?print=pretty`,
        ),
      ),
    );

    // Remove Kids Property
    stories = stories.map((story) => {
      const { kids, ...rest } = story;
      return rest;
    });

    this.logger.debug(`Fetched ${stories.length} new stories for pagination: ${JSON.stringify(pagination)}`);
    return getSearchPaginateData(stories, newStoryIds.length, pagination);
  }

  /**
   * Fetches the details of a specific story by its ID, including its comments and nested replies.
   * The method retrieves the story details and then recursively builds the comment tree by fetching each comment and its replies.
   * It handles cases where comments may be deleted or removed by returning null for those comments, which are then filtered out of the final response.
   * The response includes all relevant information about the story and its comments, structured in a way that allows for easy consumption by clients.
   */
  async getStoryDetail(id: number): Promise<StoryDetailsResponseDto> {
    this.logger.debug(`Fetching story details for ID: ${id}`);
    if (!this.HN_URL) {
      throw new Error('HN_URL is missing in environment variables');
    }

    const url = `${this.HN_URL}/v0/item/${id}.json?print=pretty`;
    this.logger.debug(`Fetching story details from URL: ${url}`);
    const story = await this.httpClientService.get<any>(
      url,
    );

    this.logger.debug(`Fetched story details for ID: ${id}, title: ${story.title}`);
    return this.buildStoryWithComments(story);
  }

  /**
   * Fetches the IDs of the stories [top, best, new] from Hacker News, limited by a maximum number defined in the environment variables.
   */
  private async getStoriesIds(
    pagination: SearchPagination,
    storyType: STORY_TYPE,
  ): Promise<number[]> {
    if (!this.HN_URL) {
      throw new Error('HN_URL is missing in environment variables');
    }

    const maximumTopStories = this.configService.get<number>(
      'MAXIMUM_TOP_STORIES',
    );

    const idsUrl = `${this.HN_URL}/v0/${storyType}.json?print=pretty&orderBy="$priority"&limitToFirst=${maximumTopStories}`;
    this.logger.debug(`Fetching ${storyType} IDs from URL: ${idsUrl}`);
    const topStoryIds = await this.httpClientService.get<number[]>(idsUrl);

    return topStoryIds;
  }

  private async buildStoryWithComments(
    item: any,
  ): Promise<StoryDetailsResponseDto> {
    const storyDetail: StoryDetailsResponseDto = {
      by: item.by,
      id: item.id,
      title: item.title,
      text: item.text,
      time: item.time,
      type: item.type,
      score: item.score,
      url: item.url,
      descendants: item.descendants,
    };

    if (item.kids && item.kids.length > 0) {
      storyDetail.comments = await Promise.all(
        item.kids.map((commentId: number) => this.buildCommentTree(commentId)),
      );
    }

    return storyDetail;
  }

  /**
   * Recursively builds a comment tree for a given comment ID by fetching the comment details from Hacker News API and its replies.
   */
  private async buildCommentTree(
    commentId: number,
  ): Promise<StoryCommentResponseDto> {
    try {
      const commentUrl = `${this.HN_URL}/v0/item/${commentId}.json?print=pretty`;
      this.logger.debug(`Fetching comment details from URL: ${commentUrl}`);
      const comment = await this.httpClientService.get<any>(commentUrl);

      const commentDto: StoryCommentResponseDto = {
        by: comment.by,
        id: comment.id,
        text: comment.text,
        time: comment.time,
        type: comment.type,
        score: comment.score,
        parent: comment.parent,
      };

      if (comment.kids && comment.kids.length > 0) {
        commentDto.comments = await Promise.all(
          comment.kids.map((replyId: number) => this.buildCommentTree(replyId)),
        );
      }

      return commentDto;
    } catch (error) {
      // Return null/skip if comment fetch fails (deleted/removed comments)
      return null;
    }
  }
}
