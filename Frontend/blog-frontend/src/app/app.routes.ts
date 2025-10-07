import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
      { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'articles', loadComponent: () => import('./pages/articles/article-list/article-list.component').then(m => m.ArticleListComponent) },
      { path: 'articles/:id', loadComponent: () => import('./pages/articles/article-detail/article-detail.component').then(m => m.ArticleDetailComponent) },
      { path: 'create-article', loadComponent: () => import('./pages/articles/create-article/create-article.component').then(m => m.CreateArticleComponent), canActivate: [authGuard] },
      { path: 'edit-article/:id', loadComponent: () => import('./pages/articles/edit-article/edit-article.component').then(m => m.EditArticleComponent), canActivate: [authGuard] },
      { path: 'my-articles', loadComponent: () => import('./pages/articles/my-articles/my-articles.component').then(m => m.MyArticlesComponent), canActivate: [authGuard] },
      { path: 'admin', loadComponent: () => import('./pages/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent), canActivate: [authGuard] },
      { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) }
    ]
  }
];