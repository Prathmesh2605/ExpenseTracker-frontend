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
  isMobileView = false;
  
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
    
    // Check if mobile view on init
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Subscribe to the current user observable
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    // Add listener for navigation events to close sidebar on mobile when navigating
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobileView && !this.sidebarCollapsed) {
        this.sidebarCollapsed = true;
        document.body.classList.remove('sidebar-open');
      }
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: MouseEvent) {
    // Close user menu when clicking outside
    if (this.userMenuOpen && this.userMenuTrigger && !this.userMenuTrigger.nativeElement.contains(event.target)) {
      this.userMenuOpen = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    
    // If on mobile and opening sidebar, we want to make sure it's fully visible
    if (this.isMobileView && !this.sidebarCollapsed) {
      // Add a class to prevent scrolling of the body when sidebar is open on mobile
      document.body.classList.add('sidebar-open');
    } else if (this.isMobileView) {
      document.body.classList.remove('sidebar-open');
    }
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

  private checkScreenSize() {
    this.isMobileView = window.innerWidth < 576;
    
    // Auto-collapse sidebar on mobile
    if (this.isMobileView && !this.sidebarCollapsed) {
      this.sidebarCollapsed = true;
    }
  }
}
