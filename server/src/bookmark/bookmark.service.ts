import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { AddBookmarkDto } from './dto/add-bookmark.dto';
import { HttpClientService } from 'src/common/services/http-client.service';
import { ConfigService } from '@nestjs/config';
import {
  SearchPagination,
  getSearchPaginateData,
} from 'src/common/decorator/pagination.decorator';
import { StoryItemDto } from 'src/story/dto/stories-list-response.dto';

@Injectable()
export class BookmarkService {
  private HN_URL: string;
  constructor(
    private readonly postgresService: PostgresService,
    private readonly httpClientService: HttpClientService,
    private readonly configService: ConfigService,
  ) {
    this.HN_URL = this.configService.get<string>('HN_URL');
  }

  /**
   * Adds a bookmark for a given story ID. It first checks if the HN_URL is configured, then verifies if the story exists by making a GET request to the Hacker News API. If the story does not exist, it throws a NotFoundException. If the story exists, it saves the bookmark in the database using the PostgresService.
   */
  async addBookmark(payload: AddBookmarkDto) {
    if (!this.HN_URL) {
      throw new BadRequestException('HN_URL is not configured');
    }

    // verify story exists via Hacker News item details API
    try {
      const story = await this.httpClientService.get<any>(
        `${this.HN_URL}/v0/item/${payload.storyId}.json?print=pretty`,
      );

      if (!story) {
        throw new NotFoundException('Story not found');
      }
    } catch (error) {
      const status = error?.status || error?.response?.status;
      if (status === 404) throw new NotFoundException('Story not found');
      throw error;
    }

    return await this.postgresService.bookmark.save({ storyId: payload.storyId });
  }

  /**
   * Lists bookmarks with pagination. It retrieves the bookmarks from the database based on the provided pagination parameters, then fetches the details of each bookmarked story from the Hacker News API. The method filters out any stories that could not be fetched (e.g., if they were deleted) and returns a paginated response containing the valid bookmarked stories.
   */
  async listBookmarks(pagination: SearchPagination) {
    const [bookmarks, count] = await this.postgresService.bookmark.findAndCount({
        skip: pagination.offset,
        take: pagination.limit,
    });

    const stories: StoryItemDto[] = await Promise.all(
      bookmarks.map((b) =>
        this.httpClientService
          .get<StoryItemDto>(
            `${this.HN_URL}/v0/item/${b.storyId}.json?print=pretty`,
          )
          .then((s) => {
            const { kids, ...rest } = s as any;
            return rest as StoryItemDto;
          })
          .catch(() => null),
      ),
    );

    const filtered = stories.filter((s) => s !== null);
    return getSearchPaginateData(filtered, count, pagination);
  }

  /**
   * Deletes a bookmark by storyId. Removes the bookmark entry from the database and returns success confirmation.
   */
  async deleteBookmark(storyId: number) {
    const result = await this.postgresService.bookmark.delete({ storyId });
    
    if (result.affected === 0) {
      throw new NotFoundException(`Bookmark for story ${storyId} not found`);
    }

    return { success: true, message: `Bookmark for story ${storyId} deleted successfully` };
  }
}
