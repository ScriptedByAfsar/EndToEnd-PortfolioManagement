import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getItem<T>(key: string, parseJson: boolean = true): T | null {
    if (this.isBrowser()) {
      const item = localStorage.getItem(key);
      if (item === null) return null;
      return parseJson ? this.parseJsonSafely(item) : item as unknown as T;
    }
    return null;
  }

  private parseJsonSafely(value: string): any {
    try {
      return JSON.parse(value);
    } catch {
      return value; // Return the original value if parsing fails
    }
  }

  setItem(key: string, value: any, stringify: boolean = true): void {
    if (this.isBrowser()) {
      const valueToStore = stringify ? JSON.stringify(value) : value;
      localStorage.setItem(key, valueToStore);
    }
  }

  removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (this.isBrowser()) {
      localStorage.clear();
    }
  }

  // Specific getters and setters for our application
  getUsername(): string | null {
    return this.getItem('username', false); // Don't parse as JSON
  }

  setUsername(username: string): void {
    this.setItem('username', username, false); // Don't stringify
  }

  getInvestedAssets(): any[] {
    return this.getItem('investedAssets') || [];
  }

  setInvestedAssets(assets: any[]): void {
    this.setItem('investedAssets', assets);
  }

  getGoalsDetails(): any[] {
    return this.getItem('goalsDetails') || [];
  }

  setGoalsDetails(goals: any[]): void {
    this.setItem('goalsDetails', goals);
  }
}
