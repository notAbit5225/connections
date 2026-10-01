import { Routes } from '@angular/router';
import { CreatePageComponent } from './pages/create-page.component';
import { PlayPageComponent } from './pages/play-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'create', pathMatch: 'full' },
  { path: 'create', component: CreatePageComponent },
  { path: 'play/:id', component: PlayPageComponent },
  { path: '**', redirectTo: 'create' },
];
