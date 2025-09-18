import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto';
import { AuthService } from '../../shared/auth.service';
import { DataUpdateService } from '../../shared/data-update.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TransactionType } from '../../Models/transaction-type.enum';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('goalsChart') goalsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assetsChart') assetsChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private goalsChart: Chart | undefined;
  private assetsChart: Chart | undefined;
  private destroy$ = new Subject<void>();
  
  // Data for charts
  goalsData: any[] = [];
  assetsData: any[] = [];
  
  // Chart colors
  private colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private dataUpdateService: DataUpdateService
  ) {}

  ngOnInit() {
    this.loadChartData();
    
    // Subscribe to master data updates
    this.dataUpdateService.masterDataUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (!update) return;
        this.loadChartData(); // Reload charts when data changes
      });
  }

  ngAfterViewInit() {
    this.initializeCharts();
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

  private loadChartData() {
    this.authService.getGoals().subscribe(goals => {
      this.goalsData = goals;
      this.updateGoalsChart();
    });

    this.authService.getAssets().subscribe(assets => {
      this.assetsData = assets;
      this.updateAssetsChart();
    });
  }

  private initializeCharts() {
    this.initializeGoalsChart();
    this.initializeAssetsChart();
  }

  private initializeGoalsChart() {
    const ctx = this.goalsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.goalsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: this.colors,
          hoverOffset: 4,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        animation: {
          animateRotate: true,
          animateScale: true
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return ` ${context.label}`;
              }
            }
          }
        }
      }
    });
  }

  private initializeAssetsChart() {
    const ctx = this.assetsChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.assetsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: this.colors,
          hoverOffset: 4,
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        animation: {
          animateRotate: true,
          animateScale: true
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              font: {
                size: 12
              },
              usePointStyle: true
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return ` ${context.label}`;
              }
            }
          }
        }
      }
    });
  }

  private updateGoalsChart() {
    const chart = this.goalsChart;
    if (!chart || !this.goalsData) return;

    // Get the latest amounts from transaction history
    this.authService.getTransactionHistory(TransactionType.Goal, 1, 1000).subscribe(response => {
      const transactions = response.items || [];
      const goalAmounts = new Map<string, number>();
      
      // Sum up all amounts for each goal
      transactions.forEach((trans: any) => {
        const currentAmount = goalAmounts.get(trans.goalName) || 0;
        goalAmounts.set(trans.goalName, currentAmount + trans.amount);
      });

      // Calculate percentages
      const totalAmount = Array.from(goalAmounts.values()).reduce((sum, amount) => sum + amount, 0);
      const labels = this.goalsData.map(goal => goal.name);
      const data = labels.map(label => {
        const amount = goalAmounts.get(label) || 0;
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        return percentage;
      });

      // Update tooltips to show amount and percentage
      const chartOptions = chart.config.options;
      if (chartOptions && chartOptions.plugins && chartOptions.plugins.tooltip) {
        chartOptions.plugins.tooltip.callbacks = {
          label: (context: any) => {
            const label = context.label || '';
            const amount = goalAmounts.get(label) || 0;
            return ` ${label}: $${amount.toFixed(2)} (${context.parsed.toFixed(1)}%)`;
          }
        };
      }

      if (chart.data) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update('default');
      }
    });
  }

  private updateAssetsChart() {
    const chart = this.assetsChart;
    if (!chart || !this.assetsData) return;

    // Get the latest amounts from transaction history
    this.authService.getTransactionHistory(TransactionType.Investment, 1, 1000).subscribe(response => {
      const transactions = response.items || [];
      const assetAmounts = new Map<string, number>();
      
      // Sum up all amounts for each asset
      transactions.forEach((trans: any) => {
        const currentAmount = assetAmounts.get(trans.planName) || 0;
        assetAmounts.set(trans.planName, currentAmount + trans.amount);
      });

      // Calculate percentages
      const totalAmount = Array.from(assetAmounts.values()).reduce((sum, amount) => sum + amount, 0);
      const labels = this.assetsData.map(asset => asset.name);
      const data = labels.map(label => {
        const amount = assetAmounts.get(label) || 0;
        const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        return percentage;
      });

      // Update tooltips to show amount and percentage
      const chartOptions = chart.config.options;
      if (chartOptions && chartOptions.plugins && chartOptions.plugins.tooltip) {
        chartOptions.plugins.tooltip.callbacks = {
          label: (context: any) => {
            const label = context.label || '';
            const amount = assetAmounts.get(label) || 0;
            return ` ${label}: $${amount.toFixed(2)} (${context.parsed.toFixed(1)}%)`;
          }
        };
      }

      if (chart.data) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update('default');
      }
    });
  }

  navigateToMain() {
    this.router.navigate(['/main']);
  }

  navigateToTargets() {
    this.router.navigate(['/targets']);
  }
}
