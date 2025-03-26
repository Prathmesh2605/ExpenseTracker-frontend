import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { ExpenseService } from '../../../core/services/expense.service';
import { Category, Expense, ExpenseCreateRequest, ExpenseUpdateRequest } from '../../../core/models/expense.model';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule
  ],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.scss']
})
export class ExpenseFormComponent implements OnInit {
  expenseForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  expenseId: string | null = null;
  
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.expenseId = id;
        this.loadExpense(id);
      }
    });
  }
  
  initForm(): void {
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(100)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      categoryId: ['', Validators.required],
      type: ['Expense', Validators.required],
      currency: ['USD', Validators.required],
      note: [''],
      isRecurring: [false]
    });
  }
  
  loadCategories(): void {
    this.isLoading = true;
    this.expenseService.getCategories()
      .pipe(
        catchError(error => {
          this.snackBar.open('Failed to load categories', 'Close', { duration: 3000 });
          console.error('Error loading categories:', error);
          return of([]);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(categories => {
        this.categories = categories;
      });
  }
  
  loadExpense(id: string): void {
    this.isLoading = true;
    this.expenseService.getExpenseById(id)
      .pipe(
        catchError(error => {
          this.snackBar.open('Failed to load expense', 'Close', { duration: 3000 });
          console.error('Error loading expense:', error);
          this.router.navigate(['/expenses']);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((expense: Expense | null) => {
        if (expense) {
          this.expenseForm.patchValue({
            description: expense.description,
            amount: expense.amount,
            date: new Date(expense.date),
            categoryId: expense.categoryId,
            type: expense.type,
            currency: expense.currency,
            isRecurring: expense.isRecurring,
            // Initialize note with an empty string because the Expense interface does not include the note field,
            // but the form has a note field, so we need to provide a default value to avoid TypeScript errors.
            note: ''
          });
        }
      });
  }
  
  onSubmit(): void {
    if (this.expenseForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    
    const formValue = this.expenseForm.value;
    
    if (this.isEditMode && this.expenseId) {
      const updateRequest: ExpenseUpdateRequest = {
        id: this.expenseId,
        description: formValue.description,
        amount: formValue.amount,
        date: formValue.date,
        categoryId: formValue.categoryId,
        type: formValue.type,
        currency: formValue.currency,
        isRecurring: formValue.isRecurring,
        note: formValue.note
      };
      
      this.expenseService.updateExpense(updateRequest)
        .pipe(
          catchError(error => {
            this.snackBar.open('Failed to update expense', 'Close', { duration: 3000 });
            console.error('Error updating expense:', error);
            return of(null);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe(result => {
          if (result) {
            this.snackBar.open('Expense updated successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/expenses']);
          }
        });
    } else {
      const createRequest: ExpenseCreateRequest = {
        description: formValue.description,
        amount: formValue.amount,
        date: formValue.date,
        categoryId: formValue.categoryId,
        type: formValue.type,
        currency: formValue.currency,
        isRecurring: formValue.isRecurring,
        note: formValue.note
      };
      
      this.expenseService.createExpense(createRequest)
        .pipe(
          catchError(error => {
            this.snackBar.open('Failed to create expense', 'Close', { duration: 3000 });
            console.error('Error creating expense:', error);
            return of(null);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe(result => {
          if (result) {
            this.snackBar.open('Expense created successfully', 'Close', { duration: 3000 });
            this.router.navigate(['/expenses']);
          }
        });
    }
  }
  
  cancel(): void {
    this.router.navigate(['/expenses']);
  }
}
