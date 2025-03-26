import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { User } from '../../core/models/auth.model';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userMenuOpen = false;
  pageTitle = 'Dashboard';
  currentUser: User | null = null;
  
  @ViewChild('userMenuTrigger') userMenuTrigger!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Update page title based on route
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.updatePageTitle(event.url);
    });
  }

  ngOnInit(): void {
    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    // Close user menu when clicking outside
    if (this.userMenuOpen && this.userMenuTrigger && !this.userMenuTrigger.nativeElement.contains(event.target)) {
      this.userMenuOpen = false;
    }
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserDisplayName(): string {
    if (this.currentUser) {
      if (this.currentUser.firstName && this.currentUser.lastName) {
        return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      }
      return this.currentUser.username;
    }
    return 'User';
  }

  private updatePageTitle(url: string): void {
    if (url.includes('/expenses')) {
      this.pageTitle = 'Expenses';
    } else if (url.includes('/categories')) {
      this.pageTitle = 'Categories';
    } else if (url.includes('/reports')) {
      this.pageTitle = 'Reports';
    } else if (url.includes('/profile')) {
      this.pageTitle = 'Profile';
    } else if (url.includes('/settings')) {
      this.pageTitle = 'Settings';
    } else {
      this.pageTitle = 'Dashboard';
    }
  }
}
