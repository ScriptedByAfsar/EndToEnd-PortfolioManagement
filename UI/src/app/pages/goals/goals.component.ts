import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';
import { TransactionType } from '../../Models/transaction-type.enum';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-goals',
  templateUrl: './goals.component.html',
  imports: [ReactiveFormsModule, CommonModule],
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit {
  goalsForm!: FormGroup;
  isSaving = false;
  isLoading = true;
  error: string | null = null;
  goals: Array<{ goalname: string; amountControl: string }> = [];

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.loadGoals();
  }

  loadGoals(): void {
    this.isLoading = true;
    this.error = null;

    this.authService.getGoals().subscribe({
      next: (goals) => {
        // Transform API response to match component's format
        this.goals = goals.map((goal: any) => ({
          goalname: goal.name,
          amountControl: goal.name.toLowerCase().replace(/\s+/g, '') + 'Amount'
        }));

        // Create form controls
        const controls = this.goals.reduce((acc: Record<string, any>, goal) => {
          acc[goal.goalname] = [false];
          acc[goal.amountControl] = [''];
          return acc;
        }, {});

        this.goalsForm = this.fb.group(controls);
        this.isLoading = false;
        this.loadInvestedAssets();
      },
      error: (err) => {
        console.error('Error loading goals:', err);
        this.error = 'Failed to load goals. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private calculatePercentage(amount: number, total: number): number {
    return total > 0 ? (amount / total) * 100 : 0;
  }

  onSubmit(): void {
    if (this.isSaving) return;

    // Get selected goals with amounts
    const selectedGoals = this.goals
      .filter(goal => this.goalsForm.get(goal.goalname)?.value)
      .map(goal => ({
        goalname: goal.goalname,
        amount: parseFloat(this.goalsForm.get(goal.amountControl)?.value || '0')
      }));

    // Get invested assets
    const investedAssets = this.storageService.getInvestedAssets();

    // Calculate totals
    const totalInvested = investedAssets.reduce((sum, asset) => sum + parseFloat(asset.amount), 0);
    const totalGoals = selectedGoals.reduce((sum, goal) => sum + goal.amount, 0);

    // Validate that total goals amount matches total invested amount
    if (totalGoals !== totalInvested) {
      this.error = `Total goals amount must equal total invested amount (${totalInvested}). Current total: ${totalGoals}`;
      return;
    }
    
    this.error = null;
    this.isSaving = true;

    // Create transactions for investments
    const investmentTransactions = investedAssets.map(asset => ({
      planName: asset.assetname,
      amount: parseFloat(asset.amount),
      percentage: this.calculatePercentage(parseFloat(asset.amount), totalInvested)
    }));

    // Create transactions for goals
    const goalTransactions = selectedGoals.map(goal => ({
      goalName: goal.goalname,
      amount: goal.amount,
      percentage: this.calculatePercentage(goal.amount, totalGoals)
    }));

    // First save the details
    const details = {
      InvestedDetails: investedAssets,
      GoalsDetails: selectedGoals
    };

    // Update totals
    const totals = {
      TotalInvested: totalInvested,
      TotalGoals: totalGoals
    };

    // Save everything in sequence
    this.authService.saveDetails(details).subscribe(() => {
      // After details are saved, update totals
      this.authService.updateTotals(totals).subscribe(() => {
        // After totals are updated, save all transactions
        const transactionRequests = [
          ...investmentTransactions.map(t => this.authService.saveInvestmentTransaction(t)),
          ...goalTransactions.map(t => this.authService.saveGoalTransaction(t))
        ];

        // Save all transactions in parallel
        forkJoin(transactionRequests).subscribe(
          () => {
            this.storageService.setGoalsDetails(selectedGoals);
            this.isSaving = false;
            alert('Goals, investments, and transactions saved successfully!');
            this.router.navigate(['/main']);
          },
          (error) => {
            this.isSaving = false;
            console.error('Error saving transactions:', error);
            alert('Error saving transactions. Please try again.');
          }
        );
      });
    });
  }

  loadInvestedAssets() {
    const investedAssets = this.storageService.getInvestedAssets();
    // ... rest of the method
  }
}
