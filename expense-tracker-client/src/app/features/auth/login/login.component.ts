import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule, MatLabel, MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatLabel,
    MatError,
    MatIconModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    HttpClientModule,
    NgIf
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  errorMessage: string | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      window.location.href = '/dashboard';
    }
  }

  navigateToRegister() {
    window.location.href = '/auth/register';
  }

  clearError(): void {
    this.errorMessage = null;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    // Reset state before attempting login
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges(); 
    
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false; // Ensure loading is reset even on success
        this.cdr.detectChanges(); 
        window.location.href = '/dashboard';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.error || 'Invalid email or password. Please try again.';
        this.cdr.detectChanges(); 
      },
      complete: () => {
        // This ensures loading state is always reset
        this.isLoading = false;
        this.cdr.detectChanges(); 
      }
    });
  }

  onInputChange() {
    this.loginForm.updateValueAndValidity();
    this.cdr.detectChanges(); 
  }
}
