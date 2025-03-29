import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ExpenseService } from '../../../core/services/expense.service';
import { Expense, ExpenseFilters, Category, PaginatedResponse } from '../../../core/models/expense.model';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/auth.model';

declare var bootstrap: any;

interface DataSource<T> {
  data: T[];
}

@Component({
  selector: 'app-expense-list',
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    FormsModule,
    DatePipe,
    CurrencyPipe,
    ExpenseModalComponent
  ]
})
export class ExpenseListComponent implements OnInit, AfterViewInit {
  isLoading = false;
  totalItems = 0;
  pageSize = 10;
  pageIndex = 0;
  sortColumn = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  filterForm!: FormGroup; 
  categories: Category[] = [];
  dataSource: DataSource<Expense> = { data: [] };
  showFilters = true;
  selectedDateRange = 'month'; 
  selectedCategories: string[] = [];
  dropdownInitialized = false;
  categoryDropdownOpen = false;
  showExpenseModal = false;
  selectedExpenseId: string | null = null;
  currentUser: User | null = null;

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  ngOnInit(): void {
    this.initFilterForm();
    this.loadCategories();
    this.loadExpenses();
    this.setDateRange(this.selectedDateRange); 
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-dropdown')) {
        this.categoryDropdownOpen = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeBootstrapDropdowns();
  }

  initializeBootstrapDropdowns(): void {
    setTimeout(() => {
      const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
      if (dropdownElementList.length > 0) {
        dropdownElementList.forEach(dropdownToggleEl => {
          new bootstrap.Dropdown(dropdownToggleEl);
        });
        this.dropdownInitialized = true;
      } else {
        // If elements aren't ready yet, try again
        if (!this.dropdownInitialized) {
          this.initializeBootstrapDropdowns();
        }
      }
    }, 100);
  }

  initFilterForm(): void {
    this.filterForm = this.fb.group({
      startDate: [null],
      endDate: [null],
      categoryIds: [[]],
      minAmount: [null],
      maxAmount: [null],
      description: ['']
    });
  }

  loadCategories(): void {
    this.expenseService.getCategories().subscribe(
      (data) => {
        this.categories = data;
      },
      (error) => {
        console.error('Error loading categories', error);
      }
    );
  }

  loadExpenses(): void {
    this.isLoading = true;
    const filter: ExpenseFilters = {
      startDate: this.filterForm.value.startDate,
      endDate: this.filterForm.value.endDate,
      categoryIds: this.selectedCategories,
      minAmount: this.filterForm.value.minAmount,
      maxAmount: this.filterForm.value.maxAmount,
      description: this.filterForm.value.description,
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      sortBy: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.expenseService.getExpenses(filter).subscribe(
      (response: PaginatedResponse<Expense>) => {
        this.dataSource = { data: response.items };
        this.totalItems = response.totalCount;
        this.isLoading = false;
      },
      (error) => {
        console.error('Error loading expenses', error);
        this.isLoading = false;
      }
    );
  }

  applyFilter(): void {
    this.pageIndex = 0;
    this.loadExpenses();
  }

  resetFilter(): void {
    this.initFilterForm();
    this.selectedCategories = [];
    this.selectedDateRange = 'month';
    this.setDateRange('month');
    this.pageIndex = 0;
    this.loadExpenses();
  }

  createExpense(): void {
    this.selectedExpenseId = null;
    this.showExpenseModal = true;
  }

  editExpense(expense: Expense): void {
    this.selectedExpenseId = expense.id;
    this.showExpenseModal = true;
  }

  deleteExpense(expense: Expense): void {
    if (confirm(`Are you sure you want to delete the expense: ${expense.description}?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe(
        () => {
          this.loadExpenses();
        },
        (error) => {
          console.error('Error deleting expense', error);
        }
      );
    }
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadExpenses();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  goToPage(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.loadExpenses();
  }

  onPageSizeChange(event: any): void {
    this.pageSize = event.target.value;
    this.pageIndex = 0;
    this.loadExpenses();
  }

  getPaginationRange(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.pageIndex + 1;
    const range: number[] = [];
    
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      range.push(i);
    }
    
    return range;
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  setDateRange(range: string): void {
    this.selectedDateRange = range;
    const today = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (range) {
      case 'week':
        const day = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - day);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        endDate = new Date(today.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
      case 'custom':
        return;
    }

    if (startDate) {
      this.filterForm.get('startDate')?.setValue(this.formatDateForInput(startDate));
    }
    if (endDate) {
      this.filterForm.get('endDate')?.setValue(this.formatDateForInput(endDate));
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSelectedCategories(): string[] {
    return this.selectedCategories;
  }

  toggleCategory(categoryId: string): void {
    const index = this.selectedCategories.indexOf(categoryId);
    if (index === -1) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories.splice(index, 1);
    }
  }

  isCategorySelected(categoryId: string): boolean {
    return this.selectedCategories.includes(categoryId);
  }

  areAllCategoriesSelected(): boolean {
    return this.categories.length > 0 && this.selectedCategories.length === this.categories.length;
  }

  toggleAllCategories(): void {
    if (this.areAllCategoriesSelected()) {
      this.selectedCategories = [];
    } else {
      this.selectedCategories = this.categories.map(c => c.id);
    }
  }

  toggleCategoryDropdown(event: Event): void {
    event.stopPropagation();
    this.categoryDropdownOpen = !this.categoryDropdownOpen;
  }

  hasActiveFilters(): boolean {
    return (
      !!this.filterForm.value.startDate ||
      !!this.filterForm.value.endDate ||
      this.selectedCategories.length > 0 ||
      !!this.filterForm.value.minAmount ||
      !!this.filterForm.value.maxAmount ||
      !!this.filterForm.value.description
    );
  }

  clearDateFilter(): void {
    this.filterForm.get('startDate')?.setValue(null);
    this.filterForm.get('endDate')?.setValue(null);
    this.selectedDateRange = 'custom';
  }

  clearCategoryFilter(): void {
    this.selectedCategories = [];
  }

  clearAmountFilter(): void {
    this.filterForm.get('minAmount')?.setValue(null);
    this.filterForm.get('maxAmount')?.setValue(null);
  }

  clearDescriptionFilter(): void {
    this.filterForm.get('description')?.setValue('');
  }

  handleModalClose(success: boolean): void {
    this.showExpenseModal = false;
    this.selectedExpenseId = null;
    
    if (success) {
      this.loadExpenses();
    }
  }
}
