import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';
import { AuthService } from '../../shared/auth.service';

@Component({
  selector: 'app-invested',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './invested.component.html',
  styleUrls: ['./invested.component.scss']
})
export class InvestedComponent implements OnInit {
  investedForm!: FormGroup;
  assets: Array<{ assetname: string; amountControl: string }> = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private storageService: StorageService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAssets();
  }

  public loadAssets(): void {
    this.isLoading = true;
    this.error = null;
    
    this.authService.getAssets().subscribe({
      next: (assets) => {
        // Transform API response to match component's format
        this.assets = assets.map((asset: any) => ({
          assetname: asset.name,
          amountControl: asset.name.toLowerCase().replace(/\s+/g, '') + 'Amount'
        }));

        // Create form controls
        const controls: Record<string, any> = this.assets.reduce((acc: Record<string, any>, asset) => {
          acc[asset.assetname] = [false];
          acc[asset.amountControl] = [''];
          return acc;
        }, {} as Record<string, any>);

        this.investedForm = this.fb.group(controls);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading assets:', err);
        this.error = 'Failed to load investment assets. Please try again.';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {   
    const selectedAssets = this.assets
      .filter(asset => this.investedForm.get(asset.assetname)?.value)
      .map(asset => ({
        assetname: asset.assetname,
        amount: this.investedForm.get(asset.amountControl)?.value
      }));

    this.storageService.setInvestedAssets(selectedAssets);
    this.router.navigate(['/goals']);
  }
}
