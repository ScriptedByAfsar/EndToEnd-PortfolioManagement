import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: [{ value: 'Afsar', disabled: false }, Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const {username, password} = this.loginForm.value;
      this.authService.login(username, password).subscribe(
        (response) => {
          // Accept any 2xx response as success
          if (response && (response.isSuccess === true)) {
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'Login failed.';
          }
        },
        (error: any) => {
          // Try to extract backend error message robustly
          if (error && error.error) {
            // If error.error is a string, try to parse as JSON
            let errObj = error.error;
            if (typeof errObj === 'string') {
              try {
                errObj = JSON.parse(errObj);
              } catch {
                // Not JSON, just show the string
                this.errorMessage = errObj;
                return;
              }
            }
            if (errObj && (errObj.Message || errObj.message)) {
              this.errorMessage = errObj.Message || errObj.message;
              return;
            }
          }
          if (error && error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Login failed.';
          }
        }
      );
    }
  }
}
