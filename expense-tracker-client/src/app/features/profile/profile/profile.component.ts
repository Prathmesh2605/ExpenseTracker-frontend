import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  isLoading = false;
  currencies = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      currency: ['INR', Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getUserProfile()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (userProfile) => {
          this.profileForm.patchValue({
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            currency: userProfile.currency || 'USD'
          });
        },
        error: (error) => {
          console.error('Error loading user profile:', error);
          this.snackBar.open('Failed to load user profile', 'Close', { duration: 3000 });
        }
      });
  }

  onUpdateProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.authService.updateProfile(this.profileForm.value)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error updating profile:', error);
            this.snackBar.open('Error updating profile', 'Close', { duration: 3000 });
          }
        });
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      this.authService.changePassword(this.passwordForm.value)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
            this.passwordForm.reset();
          },
          error: (error) => {
            console.error('Error changing password:', error);
            this.snackBar.open('Error changing password', 'Close', { duration: 3000 });
          }
        });
    }
  }

  private passwordMatchValidator(g: FormGroup): null | { mismatch: boolean } {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }
}
