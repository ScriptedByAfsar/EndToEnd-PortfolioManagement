import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../shared/auth.service';
import { TransactionType } from '../../Models/transaction-type.enum';

interface Transaction {
  planName?: string;
  goalName?: string;
  amount: number;
  percentage: number;
  timestamp: Date;
}

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transaction-history.component.html',
  styleUrls: ['./transaction-history.component.scss']
})
export class TransactionHistoryComponent implements OnInit {
  transactions: Transaction[] = [];
  selectedType: TransactionType = TransactionType.Investment;
  TransactionType = TransactionType; // Make enum available in template
  
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  switchType(type: TransactionType) {
    this.selectedType = type;
    this.loadTransactions();
  }

  loadTransactions() {
    this.authService.getTransactionHistory(this.selectedType)
      .subscribe(
        (data: Transaction[]) => {
          this.transactions = data;
        },
        error => {
          console.error('Error loading transactions:', error);
        }
      );
  }
}