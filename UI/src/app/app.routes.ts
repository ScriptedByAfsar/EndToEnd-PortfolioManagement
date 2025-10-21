import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainComponent } from './pages/main/main.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { InvestedComponent } from './pages/invested/invested.component';
import { GoalsComponent } from './pages/goals/goals.component';
import { TotalsComponent } from './pages/totals/totals.component';
import { TransactionHistoryComponent } from './pages/transaction-history/transaction-history.component';
import { authGuard } from './shared/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'main', component: MainComponent, canActivate: [authGuard] },
  { path: 'invested', component: InvestedComponent, canActivate: [authGuard] },
  { path: 'goals', component: GoalsComponent, canActivate: [authGuard] },
  { path: 'totals', component: TotalsComponent, canActivate: [authGuard] },
  { path: 'transaction-history', component: TransactionHistoryComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' } // Redirect unknown routes to Login
];
