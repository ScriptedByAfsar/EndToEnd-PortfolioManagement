import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TransactionType } from '../Models/transaction-type.enum';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5041/api/auth';
  private portfolioApiUrl = 'http://localhost:5041/api/portfolio';
  private masterDataApiUrl = 'http://localhost:5041/api/masterData';
  isLoggedIn = false;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.isLoggedIn = !!this.storageService.getUsername();
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { username, password }).pipe(
      tap(() => {
        this.isLoggedIn = true;
        this.storageService.setUsername(username);
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.storageService.removeItem('username');
        this.storageService.removeItem('investedAssets');
        this.storageService.removeItem('goalsDetails');
        this.isLoggedIn = false;
      })
    );
  }

  getTotals(): Observable<any> {
    return this.http.get(`${this.portfolioApiUrl}/totals`);
  }

  getTransactionHistory(type: TransactionType): Observable<any> {
    return this.http.get(`${this.portfolioApiUrl}/transaction-history/${type}`);
  }

  saveInvestmentTransaction(transaction: any): Observable<any> {
    return this.http.post(`${this.portfolioApiUrl}/save-investment-transaction`, transaction);
  }

  saveGoalTransaction(transaction: any): Observable<any> {
    return this.http.post(`${this.portfolioApiUrl}/save-goal-transaction`, transaction);
  }

  updateTotals(totals: any): Observable<any> {
    return this.http.post(`${this.portfolioApiUrl}/update-totals`, totals);
  }

  saveDetails(details: any): Observable<any> {
    return this.http.post(`${this.portfolioApiUrl}/save-details`, details);
  }

  // Get all active assets
  getAssets(): Observable<any> {
    return this.http.get(`${this.masterDataApiUrl}/assets`);
  }

  // Get all active goals
  getGoals(): Observable<any> {
    return this.http.get(`${this.masterDataApiUrl}/goals`);
  }

  // Add new asset
  addAsset(name: string): Observable<any> {
    return this.http.post(`${this.masterDataApiUrl}/assets`, { name });
  }

  // Add new goal
  addGoal(name: string): Observable<any> {
    return this.http.post(`${this.masterDataApiUrl}/goals`, { name });
  }

  // Update asset
  updateAsset(id: number, name: string, isActive: boolean): Observable<any> {
    return this.http.put(`${this.masterDataApiUrl}/assets/${id}`, { id, name, isActive });
  }

  // Update goal
  updateGoal(id: number, name: string, isActive: boolean): Observable<any> {
    return this.http.put(`${this.masterDataApiUrl}/goals/${id}`, { id, name, isActive });
  }

  // Delete asset
  deleteAsset(id: number): Observable<any> {
    return this.http.delete(`${this.masterDataApiUrl}/assets/${id}`);
  }

  // Delete goal
  deleteGoal(id: number): Observable<any> {
    return this.http.delete(`${this.masterDataApiUrl}/goals/${id}`);
  }
}