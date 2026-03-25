import { Routes } from '@angular/router';
import { StoriesListComponent } from './stories/stories-list.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'stories',
    pathMatch: 'full'
  },
  {
    path: 'stories',
    component: StoriesListComponent
  }
];
