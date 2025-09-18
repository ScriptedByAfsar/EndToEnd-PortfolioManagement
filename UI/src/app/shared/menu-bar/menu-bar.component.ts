import { Component, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { StorageService } from '../storage.service';
import { TransactionType } from '../../Models/transaction-type.enum';
import { forkJoin } from 'rxjs';
import { animate, state, style, transition, trigger, keyframes } from '@angular/animations';
import { DataUpdateService } from '../data-update.service';

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
  styleUrls: ['./menu-bar.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('buttonPulse', [
      state('true', style({ transform: 'scale(1)' })),
      state('false', style({ transform: 'scale(1)' })),
      transition('false <=> true', [
        animate('300ms ease-in-out', keyframes([
          style({ transform: 'scale(1)', offset: 0 }),
          style({ transform: 'scale(1.1)', offset: 0.5 }),
          style({ transform: 'scale(1)', offset: 1 })
        ]))
      ])
    ])
  ]
})
export class MenuBarComponent {
  isDarkMode = false;
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private dataUpdateService = inject(DataUpdateService);

  constructor() {
    // Theme initialization should only run on the browser
    if (isPlatformBrowser(this.platformId)) {
      const savedTheme = this.storageService.getItem('theme', false);
      if (savedTheme === 'dark') {
        this.enableDarkMode();
      }
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.enableDarkMode();
    } else {
      this.disableDarkMode();
    }
  }

  private enableDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', 'dark');
      this.storageService.setItem('theme', 'dark', false);
    }
    this.isDarkMode = true;
  }

  private disableDarkMode() {
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.removeAttribute('data-theme');
      this.storageService.setItem('theme', 'light', false);
    }
    this.isDarkMode = false;
  }

  showCard = false;
  cardType: string = '';
  subType: string = '';
  // Profile data
  profile = {
    username: 'Afsar',
    email: '',
    mobile: '',
    photoUrl: 'assets/default-profile.png'
  };
  isEditingProfile = false;
  tempProfile = { ...this.profile };
  fileInput?: HTMLInputElement;
  showClearDataModal = false;

  // For Transaction History
  investedDetails: Transaction[] = [];
  goalsDetails: Transaction[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  slideDirection = '';
  prevButtonState = false;
  nextButtonState = false;

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
    // Load cached profile if available
    const cachedProfile = this.storageService.getProfile();
    if (cachedProfile) {
      this.profile = cachedProfile;
    }

    if (this.cardType === 'profile') {
      this.loadProfile();
    } else if (this.cardType === 'totals') {
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
      invested: this.authService.getInvestedDetails(), // Get invested details directly
      goals: this.authService.getGoalsDetails(), // Get goals details directly
      totals: this.authService.getTotals() // Totals are now calculated from GoalsDetails and InvestedDetails
    }).subscribe({
      next: (response) => {
        this.totalInvestedAmount = response.totals.totalInvested;
        this.totalGoalsAmount = response.totals.totalGoals;

        // Process invested details
        const investedByAsset = new Map<string, number>();
        response.invested.forEach((item: { assetName: string; amount: number; timestamp: string }) => {
          const currentAmount = investedByAsset.get(item.assetName) || 0;
          investedByAsset.set(item.assetName, currentAmount + item.amount);
        });

        this.investedSummary = Array.from(investedByAsset.entries()).map(([name, amount]) => ({
          name,
          amount,
          percentage: this.calculatePercentage(amount, this.totalInvestedAmount),
          timestamp: new Date()
        }));

        // Process goal details
        const goalsByName = new Map<string, number>();
        response.goals.forEach((item: { goalName: string; amount: number; timestamp: string }) => {
          const currentAmount = goalsByName.get(item.goalName) || 0;
          goalsByName.set(item.goalName, currentAmount + item.amount);
        });

        this.goalsSummary = Array.from(goalsByName.entries()).map(([name, amount]) => ({
          name,
          amount,
          percentage: this.calculatePercentage(amount, this.totalGoalsAmount),
          timestamp: new Date()
        }));

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading totals:', err);
        this.error = 'Failed to load totals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  navigatePage(direction: 'next' | 'prev') {
    if (direction === 'next' && this.currentPage < this.totalPages) {
      this.nextButtonState = true;
      this.currentPage++;
      setTimeout(() => this.nextButtonState = false, 300);
    } else if (direction === 'prev' && this.currentPage > 1) {
      this.prevButtonState = true;
      this.currentPage--;
      setTimeout(() => this.prevButtonState = false, 300);
    }
    this.loadTransactionHistory(direction);
  }

  loadTransactionHistory(direction: 'next' | 'prev' | 'none' = 'none') {    if (!this.cardType || !this.subType) return;
    
    this.isLoading = true;
    this.error = null;
    this.slideDirection = direction;

    const type = this.subType === 'invested' ? TransactionType.Investment : TransactionType.Goal;
    
    this.authService.getTransactionHistory(type, this.currentPage, this.pageSize).subscribe({
      next: (response: any) => {
        const transactions = response.items;
        this.totalPages = response.totalPages;

        if (this.subType === 'invested') {
          this.investedDetails = transactions.map((t: any) => ({
            planName: t.planName,
            amount: t.amount,
            percentage: t.percentage,
            timestamp: new Date(t.timestamp)
          }));
        } else {
          this.goalsDetails = transactions.map((t: any) => ({
            goalName: t.goalName,
            amount: t.amount,
            percentage: t.percentage,
            timestamp: new Date(t.timestamp)
          }));
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.error = 'Failed to load transaction history. Please try again.';
        this.isLoading = false;
      }
    });
  }

  // Profile management methods
  startEditingProfile() {
    this.tempProfile = { ...this.profile };
    this.isEditingProfile = true;
  }

  cancelEditProfile() {
    this.tempProfile = { ...this.profile };
    this.isEditingProfile = false;
  }

  loadProfile() {
    this.isLoading = true;
    this.error = null;

    this.authService.getProfile().subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.profile = {
            username: response.data.username,
            email: response.data.email || '',
            mobile: response.data.mobile || '',
            photoUrl: response.data.profilePhotoBase64 || 'assets/default-profile.png'
          };
          this.storageService.setProfile(this.profile);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile:', err);
        this.error = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  saveProfile() {
    this.isLoading = true;
    this.error = null;

    const formData = new FormData();
    formData.append('email', this.tempProfile.email);
    formData.append('mobile', this.tempProfile.mobile);

    if (this.tempProfile.photoUrl && this.tempProfile.photoUrl.startsWith('data:')) {
      // Convert base64 to file
      const byteString = atob(this.tempProfile.photoUrl.split(',')[1]);
      const mimeType = this.tempProfile.photoUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeType });
      formData.append('profilePhoto', blob, 'profile-photo.' + mimeType.split('/')[1]);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.profile = { ...this.tempProfile };
          this.storageService.setProfile(this.profile);
          this.isEditingProfile = false;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        this.error = 'Failed to update profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          this.tempProfile.photoUrl = e.target.result as string;
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  showClearDataConfirmation() {
    this.showClearDataModal = true;
  }

  cancelClearData() {
    this.showClearDataModal = false;
  }

  confirmClearData() {
    this.isLoading = true;
    this.error = null;

    this.authService.clearAllData().subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Clear local storage and state
          this.storageService.clear();
          this.router.navigate(['/login']);
        }
        this.isLoading = false;
        this.showClearDataModal = false;
      },
      error: (err) => {
        console.error('Error clearing data:', err);
        this.error = 'Failed to clear data. Please try again.';
        this.isLoading = false;
        this.showClearDataModal = false;
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
    const trimmedName = this.newAssetName.trim();
    if (!trimmedName) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = this.masterAssets.some(
      asset => asset.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      this.error = 'An asset with this name already exists.';
      return;
    }

    this.authService.addAsset(trimmedName).subscribe({
      next: (response) => {
        this.masterAssets.push(response);
        this.newAssetName = '';
        this.error = null;
        // Notify subscribers about the new asset
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'asset',
          action: 'add',
          item: response
        });
      },
      error: (error) => {
        console.error('Error adding asset:', error);
        this.error = 'Failed to add asset. Please try again.';
      }
    });
  }

  updateAsset(asset: MasterItem) {
    const updatedAsset = { ...asset, isActive: true };
    const originalAsset = this.masterAssets.find(a => a.id === asset.id);
    if (!originalAsset) return;
    
    this.authService.updateAsset(updatedAsset.id, updatedAsset.name, updatedAsset.isActive).subscribe({
      next: () => {
        this.editMode[asset.id] = false;
        // Update local master assets list
        this.masterAssets = this.masterAssets.map(a => 
          a.id === asset.id ? updatedAsset : a
        );
        // Notify subscribers about the updated asset
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'asset',
          action: 'update',
          item: { 
            oldName: originalAsset.name,
            name: updatedAsset.name,
            id: updatedAsset.id,
            isActive: updatedAsset.isActive
          }
        });
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

  // Asset deletion
  deleteAsset(id: number) {
    const assetToDelete = this.masterAssets.find(asset => asset.id === id);
    if (!assetToDelete) return;

    this.authService.deleteAsset(id).subscribe({
      next: () => {
        this.masterAssets = this.masterAssets.filter(asset => asset.id !== id);
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'asset',
          action: 'delete',
          item: assetToDelete
        });
      },
      error: (error) => {
        console.error('Error deleting asset:', error);
      }
    });
  }

  // Goal management
  addGoal() {
    const trimmedName = this.newGoalName.trim();
    if (!trimmedName) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = this.masterGoals.some(
      goal => goal.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      this.error = 'A goal with this name already exists.';
      return;
    }

    this.authService.addGoal(trimmedName).subscribe({
      next: (response) => {
        this.masterGoals.push(response);
        this.newGoalName = '';
        this.error = null;
        // Notify subscribers about the new goal
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'goal',
          action: 'add',
          item: response
        });
      },
      error: (error) => {
        console.error('Error adding goal:', error);
        this.error = 'Failed to add goal. Please try again.';
      }
    });
  }

  updateGoal(goal: MasterItem) {
    const updatedGoal = { ...goal, isActive: true };
    const originalGoal = this.masterGoals.find(g => g.id === goal.id);
    if (!originalGoal) return;
    
    this.authService.updateGoal(updatedGoal.id, updatedGoal.name, updatedGoal.isActive).subscribe({
      next: () => {
        this.editMode[goal.id] = false;
        // Update local master goals list
        this.masterGoals = this.masterGoals.map(g => 
          g.id === goal.id ? updatedGoal : g
        );
        // Notify subscribers about the updated goal with proper structure
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'goal',
          action: 'update',
          item: { 
            oldName: originalGoal.name,
            name: updatedGoal.name,
            id: updatedGoal.id,
            isActive: updatedGoal.isActive
          }
        });
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

  // Goal deletion
  deleteGoal(id: number) {
    const goalToDelete = this.masterGoals.find(goal => goal.id === id);
    if (!goalToDelete) return;

    this.authService.deleteGoal(id).subscribe({
      next: () => {
        this.masterGoals = this.masterGoals.filter(goal => goal.id !== id);
        this.dataUpdateService.notifyMasterDataUpdate({
          type: 'goal',
          action: 'delete',
          item: goalToDelete
        });
      },
      error: (error) => {
        console.error('Error deleting goal:', error);
      }
    });
  }

  openCard(type: string, subType: string = '') {
    this.cardType = type;
    this.subType = subType || 'invested';
    this.showCard = true;
    this.currentPage = 1; // Reset page number when opening card
    
    if (type === 'profile') {
      this.loadProfile();
    } else if (type === 'totals') {
      this.loadSummary();
    } else if (type === 'history') {
      this.loadTransactionHistory('none');
    } else if (type === 'editMaster') {
      this.loadMasterData();
    }
  }
  
  switchHistoryType(type: 'invested' | 'goals') {
    this.subType = type;
    this.currentPage = 1; // Reset page number when switching history type
    this.loadTransactionHistory('none');
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

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
