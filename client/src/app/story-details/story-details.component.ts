import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StoriesService, Story, Comment, StorySummary } from '../services/stories.service';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

type StoryType = 'top' | 'best' | 'new' | 'bookmarked';

@Component({
  selector: 'app-story-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './story-details.component.html',
  styleUrls: ['./story-details.component.css']
})
export class StoryDetailsComponent implements OnInit, OnDestroy {
  story: Story | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  storyId: number | null = null;
  storyType: StoryType = 'top';
  isBookmarked: boolean = false;
  isBookmarkLoading: boolean = false;
  summary: StorySummary | null = null;
  isSummaryLoading: boolean = false;
  isSummaryVisible: boolean = false;
  summaryError: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private storiesService: StoriesService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Use combineLatest to get both params and query params efficiently
    combineLatest([
      this.route.params,
      this.route.queryParams
    ])
      .pipe(
        map(([params, queryParams]) => ({
          id: +params['id'],
          type: queryParams['type'] || 'top'
        })),
        takeUntil(this.destroy$)
      )
      .subscribe(({ id, type }) => {
        this.storyId = id;
        this.storyType = type as StoryType;
        if (this.storyId) {
          this.loadStoryDetails();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStoryDetails(): void {
    if (!this.storyId) return;

    this.isLoading = true;
    this.error = null;

    this.storiesService.getStoryDetailsWithComments(this.storyId, this.storyType)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: Story) => {
          console.log('Story Details:', response);
          this.story = response;
          this.isLoading = false;
          this.cdr.markForCheck();
          
          // Check if story is bookmarked
          this.checkIfBookmarked();
        },
        error: (error) => {
          console.error('Error loading story details:', error);
          this.error = `Failed to load story details: ${error.message}`;
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  checkIfBookmarked(): void {
    if (!this.storyId) return;

    this.storiesService.isBookmarked(this.storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isBookmarked = response.isBookmarked;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error checking bookmark status:', error);
        }
      });
  }

  addToBookmarks(): void {
    if (!this.storyId) return;

    this.isBookmarkLoading = true;
    this.cdr.markForCheck();

    this.storiesService.addBookmark(this.storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Story added to bookmarks:', response);
          this.isBookmarked = true;
          this.isBookmarkLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error adding bookmark:', error);
          this.isBookmarkLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  removeFromBookmarks(): void {
    if (!this.storyId) return;

    this.isBookmarkLoading = true;
    this.cdr.markForCheck();

    this.storiesService.removeBookmark(this.storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Story removed from bookmarks:', response);
          this.isBookmarked = false;
          this.isBookmarkLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error removing bookmark:', error);
          this.isBookmarkLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  getStorySummary(): void {
    if (!this.storyId) return;

    this.isSummaryLoading = true;
    this.summaryError = null;
    this.cdr.markForCheck();

    this.storiesService.getStorySummary(this.storyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: StorySummary) => {
          console.log('Story summary:', response);
          this.summary = response;
          this.isSummaryLoading = false;
          this.isSummaryVisible = true;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error fetching summary:', error);
          this.summaryError = `Failed to get summary: ${error.message}`;
          this.isSummaryLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  toggleSummary(): void {
    if (this.summary) {
      this.isSummaryVisible = !this.isSummaryVisible;
    } else {
      this.getStorySummary();
    }
  }

  goBack(): void {
    this.router.navigate(['/stories'], { queryParams: { type: this.storyType } });
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openUrl(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  getTotalCommentCount(comments?: Comment[]): number {
    if (!comments) return 0;
    let count = comments.length;
    comments.forEach(comment => {
      count += this.getTotalCommentCount(comment.comments);
    });
    return count;
  }

  getCommentDepth(comments?: Comment[], maxDepth: number = 0): number {
    if (!comments || comments.length === 0) return maxDepth;
    let depth = maxDepth;
    comments.forEach(comment => {
      const childDepth = this.getCommentDepth(comment.comments, maxDepth + 1);
      depth = Math.max(depth, childDepth);
    });
    return depth;
  }
}
