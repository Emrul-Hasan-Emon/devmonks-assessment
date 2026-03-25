import { Routes } from '@angular/router';
import { StoriesListComponent } from './stories/stories-list.component';
import { StoryDetailsComponent } from './story-details/story-details.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stories',
    pathMatch: 'full'
  },
  {
    path: 'stories',
    component: StoriesListComponent
  },
  {
    path: 'story/:id',
    component: StoryDetailsComponent
  }
];
