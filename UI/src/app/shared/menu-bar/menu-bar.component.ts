import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { StorageService } from '../storage.service';
import { TransactionType } from '../../Models/transaction-type.enum';
import { forkJoin } from 'rxjs';

interface Transaction {
  planName?: string;
  goalName?: string;
  amount: number;
  percentage: number;
  timestamp: Date;
}

interface Summary {
  name: string;
  amount: number;
  percentage: number;
  timestamp: Date;
}

interface MasterItem {
  id: number;
  name: string;
  isActive: boolean;
}

@Component({
  selector: 'app-menu-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  showCard = false;
  cardType: string = '';
  subType: string = '';
  username: string = 'Afsar';

  // For Transaction History
  investedDetails: Transaction[] = [];
  goalsDetails: Transaction[] = [];

  // For Totals
  investedSummary: Summary[] = [];
  goalsSummary: Summary[] = [];
  
  totalInvestedAmount: number = 0;
  totalGoalsAmount: number = 0;
  isLoading: boolean = false;
  error: string | null = null;

  // Master lists
  masterAssets: MasterItem[] = [];
  masterGoals: MasterItem[] = [];

  // Edit Master Data
  newAssetName: string = '';
  newGoalName: string = '';
  editMode: { [key: number]: boolean } = {};

  ngOnInit() {
    if (this.cardType === 'totals') {
      this.loadSummary();
    } else if (this.cardType === 'history') {
      this.loadTransactionHistory();
    }

    this.loadMasterData();
  }

  private  calculateSummary(transactions: Transaction[], masterList: { id: number; name: string }[], nameKey: 'planName' | 'goalName', total: number): Summary[] {
    // Create a map to store sums for each name
    const sums = new Map<string, number>();
    
    // Initialize all master items with 0
    masterList.forEach(item => sums.set(item.name, 0));
    
    // Sum up all transactions
    transactions.forEach(trans => {
      const name = trans[nameKey];
      if (name) {
        sums.set(name, (sums.get(name) || 0) + trans.amount);
      }
    });
    
    // Convert to Summary array
    return masterList.map(item => {
      const amount = sums.get(item.name) || 0;
      // Find the latest transaction for this name
      const latestTransaction = transactions
        .filter(t => t[nameKey] === item.name)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return {
        name: item.name,
        amount,
        percentage: this.calculatePercentage(amount, total),
        timestamp: latestTransaction?.timestamp || new Date()
      };
    });
  }

  loadSummary() {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      invested: this.authService.getTransactionHistory(TransactionType.Investment),
      goals: this.authService.getTransactionHistory(TransactionType.Goal),
      totals: this.authService.getTotals()
    }).subscribe({
      next: (response) => {
        this.totalInvestedAmount = response.totals.totalInvested;
        this.totalGoalsAmount = response.totals.totalGoals;

        // Calculate summaries from transactions
        this.investedSummary = this.calculateSummary(
          response.invested,
          this.masterAssets,
          'planName',
          this.totalInvestedAmount
        );

        this.goalsSummary = this.calculateSummary(
          response.goals,
          this.masterGoals,
          'goalName',
          this.totalGoalsAmount
        );

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading totals:', err);
        this.error = 'Failed to load totals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadTransactionHistory() {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      invested: this.authService.getTransactionHistory(TransactionType.Investment),
      goals: this.authService.getTransactionHistory(TransactionType.Goal)
    }).subscribe({
      next: (response) => {
        this.investedDetails = response.invested;
        this.goalsDetails = response.goals;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.error = 'Failed to load transaction history. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadMasterData() {
    this.isLoading = true;
    this.error = null;

    forkJoin({
      assets: this.authService.getAssets(),
      goals: this.authService.getGoals()
    }).subscribe({
      next: (response) => {
        this.masterAssets = response.assets;
        this.masterGoals = response.goals;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading master data:', err);
        this.error = 'Failed to load master data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Asset management
  addAsset() {
    if (!this.newAssetName.trim()) return;
    
    this.authService.addAsset(this.newAssetName).subscribe({
      next: (response: any) => {
        this.masterAssets.push(response);
        this.newAssetName = '';
        this.loadSummary(); // Refresh summaries
      },
      error: (err: any) => {
        console.error('Error adding asset:', err);
        this.error = 'Failed to add asset. Please try again.';
      }
    });
  }

  updateAsset(asset: MasterItem) {
    const updatedAsset = { ...asset, isActive: true };
    this.authService.updateAsset(updatedAsset.id, updatedAsset.name, updatedAsset.isActive).subscribe({
      next: () => {
        this.editMode[asset.id] = false;
        this.loadSummary(); // Refresh summaries
        if (this.cardType === 'history') {
          this.loadTransactionHistory();
        }
      },
      error: (err: any) => {
        console.error('Error updating asset:', err);
        this.error = 'Failed to update asset. Please try again.';
      }
    });
  }

  deleteAsset(id: number) {
    this.authService.deleteAsset(id).subscribe({
      next: () => {
        this.masterAssets = this.masterAssets.filter(a => a.id !== id);
        this.loadSummary(); // Refresh summaries
      },
      error: (err: any) => {
        console.error('Error deleting asset:', err);
        this.error = 'Failed to delete asset. Please try again.';
      }
    });
  }

  // Goal management
  addGoal() {
    if (!this.newGoalName.trim()) return;
    
    this.authService.addGoal(this.newGoalName).subscribe({
      next: (response: any) => {
        this.masterGoals.push(response);
        this.newGoalName = '';
        this.loadSummary(); // Refresh summaries
      },
      error: (err: any) => {
        console.error('Error adding goal:', err);
        this.error = 'Failed to add goal. Please try again.';
      }
    });
  }

  updateGoal(goal: MasterItem) {
    const updatedGoal = { ...goal, isActive: true };
    this.authService.updateGoal(updatedGoal.id, updatedGoal.name, updatedGoal.isActive).subscribe({
      next: () => {
        this.editMode[goal.id] = false;
        // Refresh both summaries and transaction history since goal name has changed
        this.loadSummary();
        if (this.cardType === 'history') {
          this.loadTransactionHistory();
        }
      },
      error: (err: any) => {
        console.error('Error updating goal:', err);
        this.error = 'Failed to update goal. Please try again.';
      }
    });
  }

  deleteGoal(id: number) {
    this.authService.deleteGoal(id).subscribe({
      next: () => {
        this.masterGoals = this.masterGoals.filter(g => g.id !== id);
        this.loadSummary(); // Refresh summaries
      },
      error: (err: any) => {
        console.error('Error deleting goal:', err);
        this.error = 'Failed to delete goal. Please try again.';
      }
    });
  }

  openCard(type: string, subType: string = '') {
    this.cardType = type;
    this.subType = subType || 'invested';
    this.showCard = true;
    
    if (type === 'totals') {
      this.loadSummary();
    } else if (type === 'history') {
      this.loadTransactionHistory();
    } else if (type === 'editMaster') {
      this.loadMasterData();
    }
  }

  closeCard() {
    this.showCard = false;
    this.cardType = '';
    this.subType = '';
    this.error = null;
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed:', error);
        this.authService.isLoggedIn = false;
        this.storageService.clear();
        this.router.navigate(['/login']);
      }
    });
  }

  calculatePercentage(amount: number, total: number): number {
    return total > 0 ? Number(((amount / total) * 100).toFixed(2)) : 0;
  }
}
