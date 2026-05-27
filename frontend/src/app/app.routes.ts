import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { landingGuard } from './core/guards/landing.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [landingGuard],
    loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
  },
  {
    path: 'lobby',
    loadComponent: () => import('./lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'game',
    loadComponent: () => import('./game/game.component').then(m => m.GameComponent),
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    loadComponent: () => import('./shop/shop.component').then(m => m.ShopComponent),
  },
  {
    path: 'stats',
    canActivate: [authGuard],
    loadComponent: () => import('./stats/stats.component').then(m => m.StatsComponent),
  },
  {
    path: 'legal/privacy-policy',
    loadComponent: () => import('./legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  { path: '**', redirectTo: '' },
];
