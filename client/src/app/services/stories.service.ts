import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Story {
  id: number;
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  kids?: number[];
  type?: string;
  comments?: Comment[];
}

export interface Comment {
  id: number;
  by?: string;
  text?: string;
  time: number;
  type: string;
  parent: number;
  comments?: Comment[];
}

export interface SearchPagination {
  page: number;
  size: number;
  limit: number;
  offset: number;
}

export interface StoriesResponse {
  data: Story[];
  pagination: {
    totalItems: number;
    page: number;
    size: number;
    hasNext: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StoriesService {
  private baseUrl = 'http://localhost:3000/v1/api/story';
  private bookmarkUrl = 'http://localhost:3000/v1/api/bookmark';

  constructor(private http: HttpClient) {}

  getTopStories(page: number = 0, size: number = 10): Observable<StoriesResponse> {
    return this.http.get<StoriesResponse>(`${this.baseUrl}/top-stories`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getBestStories(page: number = 0, size: number = 10): Observable<StoriesResponse> {
    return this.http.get<StoriesResponse>(`${this.baseUrl}/best-stories`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getNewStories(page: number = 0, size: number = 10): Observable<StoriesResponse> {
    return this.http.get<StoriesResponse>(`${this.baseUrl}/new-stories`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getBookmarkedStories(page: number = 0, size: number = 10): Observable<StoriesResponse> {
    return this.http.get<StoriesResponse>(`${this.bookmarkUrl}`, {
      params: { page: page.toString(), size: size.toString() }
    });
  }

  getStoryDetails(id: number, type: 'top' | 'best' | 'new' = 'top'): Observable<Story> {
    return this.http.get<Story>(`${this.baseUrl}/${type}-story-details/${id}`);
  }

  getStoryDetailsWithComments(id: number, type: 'top' | 'best' | 'new' | 'bookmarked' = 'top'): Observable<Story> {
    const endpoint = type === 'bookmarked' ? `${this.bookmarkUrl}/${id}` : `${this.baseUrl}/${type}-story-details/${id}`;
    return this.http.get<Story>(endpoint);
  }

  addBookmark(storyId: number): Observable<any> {
    return this.http.post(`${this.bookmarkUrl}`, { storyId });
  }
}
