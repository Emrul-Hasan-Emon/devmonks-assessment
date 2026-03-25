import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { StoriesService, Story, StoriesResponse } from '../services/stories.service';

type StoryType = 'top' | 'best' | 'new' | 'bookmarked';

interface Tab {
  id: StoryType;
  label: string;
}

@Component({
  selector: 'app-stories-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './stories-list.component.html',
  styleUrls: ['./stories-list.component.css']
})
export class StoriesListComponent implements OnInit {
  stories: Story[] = [];
  activeTab: StoryType = 'top';
  currentPage: number = 0;
  pageSize: number = 10;
  isLoading: boolean = false;
  error: string | null = null;
  totalPages: number = 0;
  hasMorePages: boolean = false;
  bookmarkedStoryIds: Set<number> = new Set();
  bookmarkingStoryIds: Set<number> = new Set();

  tabs: Tab[] = [
    { id: 'top', label: 'Top Stories' },
    { id: 'best', label: 'Best Stories' },
    { id: 'new', label: 'New Stories' },
    { id: 'bookmarked', label: 'Bookmarked' }
  ];

  constructor(private storiesService: StoriesService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.loadStories();
  }

  selectTab(tabId: StoryType): void {
    if (this.activeTab !== tabId) {
      this.activeTab = tabId;
      this.currentPage = 0;
      this.loadStories();
    }
  }

  loadStories(): void {
    this.isLoading = true;
    this.error = null;

    let request;

    switch (this.activeTab) {
      case 'top':
        request = this.storiesService.getTopStories(this.currentPage, this.pageSize);
        break;
      case 'best':
        request = this.storiesService.getBestStories(this.currentPage, this.pageSize);
        break;
      case 'new':
        request = this.storiesService.getNewStories(this.currentPage, this.pageSize);
        break;
      case 'bookmarked':
        request = this.storiesService.getBookmarkedStories(this.currentPage, this.pageSize);
        break;
      default:
        this.error = 'Invalid tab selected';
        this.isLoading = false;
        return;
    }

    request.subscribe({
      next: (response: any) => {
        console.log('Raw API Response:', response);
        
        // Handle both direct data array and paginated response
        if (Array.isArray(response)) {
          this.stories = response;
          this.totalPages = 1;
          this.hasMorePages = false;
        } else if (response.data && Array.isArray(response.data)) {
          this.stories = response.data;
          
          // Parse pagination info
          if (response.pagination) {
            const pagination = response.pagination;
            const totalItems = pagination.totalItems || 0;
            const pageSize = pagination.size || this.pageSize;
            
            // Calculate total pages based on totalItems and page size
            this.totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1;
            
            // Use hasNext flag if available, otherwise check array length
            this.hasMorePages = pagination.hasNext !== undefined ? pagination.hasNext : this.stories.length >= pageSize;
            
            console.log('Pagination Info:', { totalItems, pageSize, totalPages: this.totalPages, hasNext: this.hasMorePages });
          } else {
            this.totalPages = 1;
            this.hasMorePages = this.stories.length >= this.pageSize;
          }
        } else {
          this.stories = [];
          this.totalPages = 0;
          this.hasMorePages = false;
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
        console.log('Loaded stories:', this.stories);
        
        // Check bookmark status for each story
        this.stories.forEach(story => {
          this.checkIfBookmarked(story.id);
        });
      },
      error: (error) => {
        console.error('Error loading stories:', error);
        this.error = `Failed to load stories: ${error.message}`;
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  checkIfBookmarked(storyId: number): void {
    this.storiesService.isBookmarked(storyId).subscribe({
      next: (response: any) => {
        if (response.isBookmarked) {
          this.bookmarkedStoryIds.add(storyId);
        } else {
          this.bookmarkedStoryIds.delete(storyId);
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error checking bookmark status:', error);
      }
    });
  }

  isStoryBookmarked(storyId: number): boolean {
    return this.bookmarkedStoryIds.has(storyId);
  }

  addToBookmarks(storyId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.bookmarkingStoryIds.add(storyId);
    this.cdr.markForCheck();

    this.storiesService.addBookmark(storyId).subscribe({
      next: (response) => {
        console.log('Story added to bookmarks:', response);
        this.bookmarkedStoryIds.add(storyId);
        this.bookmarkingStoryIds.delete(storyId);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error adding bookmark:', error);
        this.bookmarkingStoryIds.delete(storyId);
        this.cdr.markForCheck();
      }
    });
  }

  removeFromBookmarks(storyId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.bookmarkingStoryIds.add(storyId);
    this.cdr.markForCheck();

    this.storiesService.removeBookmark(storyId).subscribe({
      next: (response) => {
        console.log('Story removed from bookmarks:', response);
        this.bookmarkedStoryIds.delete(storyId);
        this.bookmarkingStoryIds.delete(storyId);
        this.cdr.markForCheck();
        
        // If we're viewing the bookmarked tab, reload the list to show updated bookmarks
        if (this.activeTab === 'bookmarked') {
          this.loadStories();
        }
      },
      error: (error) => {
        console.error('Error removing bookmark:', error);
        this.bookmarkingStoryIds.delete(storyId);
        this.cdr.markForCheck();
      }
    });
  }

  nextPage(): void {
    if (this.hasMorePages || (this.totalPages > 0 && this.currentPage < this.totalPages - 1)) {
      this.currentPage++;
      this.loadStories();
    }
  }

  previousPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadStories();
    }
  }

  goToPage(pageNumber: number): void {
    // pageNumber is 1-indexed (user sees 1, 2, 3...) but we convert to 0-indexed
    const zeroIndexedPage = pageNumber - 1;
    if (zeroIndexedPage >= 0 && zeroIndexedPage < this.totalPages) {
      this.currentPage = zeroIndexedPage;
      this.loadStories();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 0; i < this.totalPages; i++) {
      pages.push(i + 1); // Convert 0-indexed to 1-indexed for display
    }
    return pages;
  }

  goToFirstPage(): void {
    this.currentPage = 0;
    this.loadStories();
  }

  goToLastPage(): void {
    if (this.totalPages > 0) {
      this.currentPage = Math.max(0, this.totalPages - 1);
      this.loadStories();
    }
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString();
  }

  openStory(url: string): void {
    window.open(url, '_blank');
  }

  viewStoryDetails(storyId: number): void {
    this.router.navigate(['/story', storyId], { queryParams: { type: this.activeTab } });
  }
}
