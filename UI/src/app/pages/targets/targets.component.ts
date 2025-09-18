import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Chart } from 'chart.js/auto';
import { AuthService } from '../../shared/auth.service';
import { DataUpdateService } from '../../shared/data-update.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransactionType } from '../../Models/transaction-type.enum';

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './targets.component.html',
  styleUrl: './targets.component.scss'
})
export class TargetsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('goalsChart') goalsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assetsChart') assetsChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private goalsChart: Chart | undefined;
  private assetsChart: Chart | undefined;
  private destroy$ = new Subject<void>();
  
  showTargetCard = false;
  investedAssets: any[] = [];
  goals: any[] = [];
  
  constructor(
    private authService: AuthService,
    private router: Router,
    private dataUpdateService: DataUpdateService
  ) {}

  ngOnInit() {
    console.log('TargetsComponent initialized');
    this.loadData();
    
    this.dataUpdateService.masterDataUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (!update) return;
        this.loadData();
      });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.goalsChart) {
      this.goalsChart.destroy();
    }
    if (this.assetsChart) {
      this.assetsChart.destroy();
    }
  }

  private loadData() {
    this.authService.getAssets().subscribe({
      next: (assets) => {
        console.log('Assets loaded:', assets);
        this.investedAssets = assets;
        if (this.assetsChart) {
          this.updateAssetsChart();
        }
      },
      error: (error) => {
        console.error('Error loading assets:', error);
      }
    });

    this.authService.getGoals().subscribe({
      next: (goals) => {
        console.log('Goals loaded:', goals);
        this.goals = goals;
        if (this.goalsChart) {
          this.updateGoalsChart();
        }
      },
      error: (error) => {
        console.error('Error loading goals:', error);
      }
    });
  }

  private initializeCharts() {
    console.log('Initializing charts');
    if (this.goalsChartCanvas && this.assetsChartCanvas) {
      this.initializeGoalsChart();
      this.initializeAssetsChart();
    }
  }

  private initializeGoalsChart() {
    const ctx = this.goalsChartCanvas?.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get goals chart context');
      return;
    }

    this.goalsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: '#4BC0C0',
          borderColor: '#4BC0C0',
          borderWidth: 1,
          barPercentage: 0.5
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw || 0;
                const target = this.goals[context.dataIndex]?.target || 1;
                return `Progress: ${((value/target) * 100).toFixed(1)}% (${value}/${target})`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Progress (%)'
            }
          }
        }
      }
    });
  }

  private initializeAssetsChart() {
    const ctx = this.assetsChartCanvas?.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get assets chart context');
      return;
    }
    
    this.assetsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: '#36A2EB',
          borderColor: '#36A2EB',
          borderWidth: 1,
          barPercentage: 0.5
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw || 0;
                const target = this.investedAssets[context.dataIndex]?.target || 1;
                return `Progress: ${((value/target) * 100).toFixed(1)}% (${value}/${target})`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Progress (%)'
            }
          }
        }
      }
    });
  }

  private updateGoalsChart() {
    if (!this.goalsChart) {
      console.error('Goals chart not initialized');
      return;
    }
    
    // Get the latest amounts from transaction history
    this.authService.getTransactionHistory(TransactionType.Goal, 1, 1000).subscribe({
      next: (response) => {
        const transactions = response.items || [];
        const goalAmounts = new Map<string, number>();
        
        // Sum up all amounts for each goal
        transactions.forEach((trans: any) => {
          const currentAmount = goalAmounts.get(trans.goalName) || 0;
          goalAmounts.set(trans.goalName, currentAmount + trans.amount);
        });

        const labels = this.goals.map(goal => goal.name);
        const data = this.goals.map(goal => {
          const amount = goalAmounts.get(goal.name) || 0;
          const progress = (amount / (goal.target || 1)) * 100;
          return Math.min(progress, 100);
        });

        this.goalsChart!.data.labels = labels;
        this.goalsChart!.data.datasets[0].data = data;
        this.goalsChart!.update();
      },
      error: (error) => {
        console.error('Error fetching goal transactions:', error);
      }
    });
  }

  private updateAssetsChart() {
    if (!this.assetsChart) {
      console.error('Assets chart not initialized');
      return;
    }
    
    // Get the latest amounts from transaction history
    this.authService.getTransactionHistory(TransactionType.Investment, 1, 1000).subscribe({
      next: (response) => {
        const transactions = response.items || [];
        const assetAmounts = new Map<string, number>();
        
        // Sum up all amounts for each asset
        transactions.forEach((trans: any) => {
          const currentAmount = assetAmounts.get(trans.planName) || 0;
          assetAmounts.set(trans.planName, currentAmount + trans.amount);
        });

        const labels = this.investedAssets.map(asset => asset.name);
        const data = this.investedAssets.map(asset => {
          const amount = assetAmounts.get(asset.name) || 0;
          const progress = (amount / (asset.target || 1)) * 100;
          return Math.min(progress, 100);
        });

        this.assetsChart!.data.labels = labels;
        this.assetsChart!.data.datasets[0].data = data;
        this.assetsChart!.update();
      },
      error: (error) => {
        console.error('Error fetching investment transactions:', error);
      }
    });
  }

  toggleTargetCard() {
    this.showTargetCard = !this.showTargetCard;
  }

  saveTargets() {
    console.log('Saving targets:', { goals: this.goals, assets: this.investedAssets });
    this.authService.saveTargets(this.goals, this.investedAssets).subscribe({
      next: () => {
        console.log('Targets saved successfully');
        this.showTargetCard = false;
        this.loadData(); // Reload data to update charts
      },
      error: (error) => {
        console.error('Error saving targets:', error);
      }
    });
  }

  navigateToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
