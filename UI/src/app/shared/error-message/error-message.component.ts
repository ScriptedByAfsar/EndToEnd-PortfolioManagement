import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-error-message',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message" class="error-message">
      {{ message }}
    </div>
  `,
  styles: [`
    .error-message {
      background-color: #ff4444;
      color: white;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      text-align: center;
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translate(-50%, -100%);
        opacity: 0;
      }
      to {
        transform: translate(-50%, 0);
        opacity: 1;
      }
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message: string = '';
}
