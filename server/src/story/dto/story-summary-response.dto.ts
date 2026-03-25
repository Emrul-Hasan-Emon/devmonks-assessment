import { StorySummarySentimentEnum } from "src/database/enums/story-summary.enum";

export interface StorySummaryResponseDto {
  storyId: number;
  summary: string;
  keyPoints: string[];
  sentiment: StorySummarySentimentEnum;
  commentCount: number;
  model: string;
  tokensUsed: number;
  timestamp: Date;
}
