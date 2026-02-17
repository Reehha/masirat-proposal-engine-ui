import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { Settings } from './components/settings/settings';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { AuthGuard } from './guards/auth-guard';
import { ResetPasswordGuard } from './guards/reset-password-guard';
import { ProposalGeneratorComponent } from './components/proposal-generator/proposal-generator';


export const routes: Routes = [
  /* Public */
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: '', redirectTo: '/login', pathMatch: 'full' },

  /* Protected (admin) */
  {
    path: 'generator',
    component: ProposalGeneratorComponent,
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN'] },
  },
  {
    path: 'settings',
    component: Settings,
    canActivate: [AuthGuard],
    data: { roles: ['admin'] },
  },

  { path: 'unauthorized', component: Unauthorized },

  /* Fallback */
  { path: '**', redirectTo: '/login' },
];
