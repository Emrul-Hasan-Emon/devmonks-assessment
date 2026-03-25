export class StoryCommentResponseDto {
  by: string;
  id: number;
  text?: string;
  time: number;
  type: string;
  score?: number;
  parent?: number;
  comments?: StoryCommentResponseDto[];
}

export class StoryDetailsResponseDto {
  by: string;
  id: number;
  title?: string;
  text?: string;
  time: number;
  type: string;
  score?: number;
  url?: string;
  descendants?: number;
  comments?: StoryCommentResponseDto[];
}
