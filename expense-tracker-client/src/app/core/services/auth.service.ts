import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/auth.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/api/Auth`;
  private readonly tokenKey = 'token';
  private readonly refreshTokenKey = 'refreshToken';
  private readonly userKey = 'user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadStoredUser();
  }
  
  headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'text/plain'
  });
  
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request, { headers: this.headers }).pipe(
      tap(response => {
        this.handleAuthResponse(response);
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap(response => this.handleAuthResponse(response))
    );
  }

  updateProfile(profileData: { email: string, firstName: string, lastName: string, currency: string }): Observable<any> {
    const token = this.getStoredToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    // Construct the URL with query parameters
    const url = `${environment.apiUrl}/api/UserProfile?FirstName=${encodeURIComponent(profileData.firstName)}&LastName=${encodeURIComponent(profileData.lastName)}&PreferredCurrency=${encodeURIComponent(profileData.currency)}`;

    return this.http.put<any>(url, {}, { headers }).pipe(
      tap(response => {
        // Update the stored user data
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedUser: User = {
            ...currentUser,
            email: profileData.email, // Email is not updated via API but keep it in sync locally
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            currency: profileData.currency
          };
          localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  getUserProfile(): Observable<any> {
    const token = this.getStoredToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(`${environment.apiUrl}/api/UserProfile`, { headers }).pipe(
      tap(userProfile => {
        // Update the stored user data with the latest from the server
        if (userProfile) {
          const updatedUser: User = {
            id: userProfile.id,
            username: userProfile.email, // Using email as username if not provided
            email: userProfile.email,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            currency: userProfile.currency
          };
          localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      })
    );
  }

  changePassword(passwordData: { currentPassword: string, newPassword: string, confirmPassword: string }): Observable<any> {
    const token = this.getStoredToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(`${this.apiUrl}/change-password`, passwordData, { headers });
  }

  getStoredToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getStoredToken();
  }

  redirectToDashboard(): void {
    window.location.href = '/dashboard';
  }

  private handleAuthResponse(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    
    const user: User = {
      id: response.user.id,
      username: response.user.username,
      email: response.user.email,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      currency: response.user.preferredCurrency
    };
    
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private loadStoredUser(): void {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }
}
