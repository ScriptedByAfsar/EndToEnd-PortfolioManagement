import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { StorageService } from '../../shared/storage.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  mainForm!: FormGroup;
  totalAmount: number = 0;
  username: string = '';

  constructor(private fb: FormBuilder, private router: Router, private storageService: StorageService) {}

  ngOnInit(): void {
    this.mainForm = this.fb.group({
      totalAmount: ['', [Validators.required, Validators.min(1)]]
    });
    this.username = this.storageService.getUsername() || '';
    // handle totalAmount with storage service
    const totalAmount = this.totalAmount.toString();
    this.storageService.setItem('totalAmount', totalAmount);
  }

  onSubmit(): void {
    if (this.mainForm.valid) {
      const { totalAmount } = this.mainForm.value;
      localStorage.setItem('totalAmount', totalAmount);
      this.router.navigate(['/invested']);
    }
  }
}
