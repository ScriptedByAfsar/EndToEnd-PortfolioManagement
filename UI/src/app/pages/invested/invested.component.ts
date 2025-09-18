import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { StorageService } from '../../shared/storage.service';
import { AuthService } from '../../shared/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DataUpdateService } from '../../shared/data-update.service';

@Component({
  selector: 'app-invested',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './invested.component.html',
  styleUrls: ['./invested.component.scss']
})
export class InvestedComponent implements OnInit, OnDestroy {
  investedForm!: FormGroup;
  assets: Array<{ assetname: string; amountControl: string }> = [];
  isLoading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder, 
    private router: Router, 
    private storageService: StorageService,
    private authService: AuthService,
    private dataUpdateService: DataUpdateService
  ) {
    // Subscribe to master data updates
    this.dataUpdateService.masterDataUpdate$
      .pipe(takeUntil(this.destroy$))
      .subscribe(update => {
        if (!update) return;
        if (update.type === 'asset') {
          if (update.action === 'add') {
            this.assets.push({
              assetname: update.item.name,
              amountControl: update.item.name.toLowerCase().replace(/\s+/g, '') + 'Amount'
            });
            // Add new form controls for the new asset
            const controls = this.investedForm?.controls || {};
            controls[update.item.name] = this.fb.control(false);
            controls[update.item.name.toLowerCase().replace(/\s+/g, '') + 'Amount'] = this.fb.control('');
            this.investedForm = this.fb.group(controls);
          } else if (update.action === 'delete') {
            // Remove the asset and its controls from the form
            const assetToRemove = this.assets.find(a => a.assetname === update.item.name);
            if (assetToRemove) {
              this.assets = this.assets.filter(a => a.assetname !== update.item.name);
              const controls = { ...this.investedForm.controls };
              delete controls[assetToRemove.assetname];
              delete controls[assetToRemove.amountControl];
              this.investedForm = this.fb.group(controls);
            }
          } else if (update.action === 'update') {
            // Update the asset name in the form
            const assetToUpdate = this.assets.find(a => a.assetname === update.item.oldName);
            if (assetToUpdate) {
              // Store the current values
              const isChecked = this.investedForm.get(assetToUpdate.assetname)?.value;
              const amount = this.investedForm.get(assetToUpdate.amountControl)?.value;

              // Remove old controls
              const controls = { ...this.investedForm.controls };
              delete controls[assetToUpdate.assetname];
              delete controls[assetToUpdate.amountControl];

              // Update asset in list
              const newAmountControl = update.item.name.toLowerCase().replace(/\s+/g, '') + 'Amount';
              this.assets = this.assets.map(a => 
                a.assetname === update.item.oldName 
                  ? { assetname: update.item.name, amountControl: newAmountControl }
                  : a
              );

              // Add new controls with previous values
              controls[update.item.name] = this.fb.control(isChecked);
              controls[newAmountControl] = this.fb.control(amount);

              // Update form
              this.investedForm = this.fb.group(controls);
              
              // Force change detection
              this.investedForm.updateValueAndValidity({ emitEvent: true });
            }
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

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
    const totalAmount = selectedAssets.reduce((sum, asset) => sum + parseFloat(asset.amount || '0'), 0);
    const storedTotalAmount = parseFloat(localStorage.getItem('totalAmount') || '0');

    if (totalAmount !== storedTotalAmount) {
      this.error = `Total invested amount must equal ${storedTotalAmount}.`;
      return;
    }
    
    this.error = null;
    this.storageService.setInvestedAssets(selectedAssets);
    this.router.navigate(['/goals']);
  }
}
