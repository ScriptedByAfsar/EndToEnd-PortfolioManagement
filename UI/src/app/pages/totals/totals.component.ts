import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../shared/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-totals',
  imports: [CommonModule],
  templateUrl: './totals.component.html',
  styleUrls: ['./totals.component.scss']
})
export class TotalsComponent implements OnInit {
  totals: any;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.getTotals().subscribe(
      (data) => {
        this.totals = data;
      },
      (error) => {
        console.error('Error fetching totals:', error);
      }
    );
  }
}
