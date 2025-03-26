import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ExpenseService } from '../../../core/services/expense.service';
import { Category, Expense, ExpenseCreateRequest, ExpenseUpdateRequest } from '../../../core/models/expense.model';
import { catchError, finalize, of } from 'rxjs';

@Component({
  selector: 'app-expense-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './expense-modal.component.html',
  styleUrls: ['./expense-modal.component.scss']
})
export class ExpenseModalComponent implements OnInit {
  @Input() expenseId: string | null = null;
  @Output() close = new EventEmitter<boolean>();
  
  expenseForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isSubmitting = false;
  isEditMode = false;
  currentStep = 1;
  totalSteps = 4;
  
  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    
    if (this.expenseId) {
      this.isEditMode = true;
      this.loadExpense(this.expenseId);
    }
  }
  
  initForm(): void {
    this.expenseForm = this.fb.group({
      description: ['', [Validators.required, Validators.maxLength(100)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      date: [new Date(), Validators.required],
      categoryId: ['', Validators.required],
      type: ['Expense', Validators.required],
      currency: ['USD', Validators.required],
      notes: [''],
      isRecurring: [false]
    });
  }
  
  loadCategories(): void {
    this.isLoading = true;
    this.expenseService.getCategories()
      .pipe(
        catchError(error => {
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
          console.error('Error loading expense:', error);
          this.closeModal(false);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe((expense: Expense | null) => {
        if (expense) {
          // Format the date as YYYY-MM-DD for the date input field
          let formattedDate: string | Date;
          if (expense.date) {
            const date = new Date(expense.date);
            formattedDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
          } else {
            formattedDate = new Date().toISOString().split('T')[0];
          }
          
          this.expenseForm.patchValue({
            description: expense.description,
            amount: expense.amount,
            date: formattedDate,
            categoryId: expense.categoryId,
            type: expense.type,
            currency: expense.currency,
            isRecurring: expense.isRecurring,
            notes: expense.notes || ''
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
        notes: formValue.notes
      };
      
      this.expenseService.updateExpense(updateRequest)
        .pipe(
          catchError(error => {
            console.error('Error updating expense:', error);
            return of(null);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe(result => {
          this.closeModal(!!result);
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
        notes: formValue.notes
      };
      
      this.expenseService.createExpense(createRequest)
        .pipe(
          catchError(error => {
            console.error('Error creating expense:', error);
            return of(null);
          }),
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe(result => {
          this.closeModal(!!result);
        });
    }
  }
  
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validate current step before proceeding
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    } else {
      this.onSubmit();
    }
  }
  
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  
  validateCurrentStep(): boolean {
    const controls = this.expenseForm.controls;
    
    switch (this.currentStep) {
      case 1: // Basic Info
        return controls['description'].valid && controls['amount'].valid && controls['currency'].valid;
      case 2: // Date and Category
        return controls['date'].valid && controls['categoryId'].valid;
      case 3: // Type and Recurring
        return controls['type'].valid;
      default:
        return true;
    }
  }
  
  getCategoryName(categoryId: string | null): string {
    if (!categoryId) return 'None';
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'None';
  }
  
  closeModal(success: boolean = false): void {
    this.close.emit(success);
  }
  
  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Basic Information';
      case 2:
        return 'Date & Category';
      case 3:
        return 'Type & Options';
      case 4:
        return 'Additional Notes';
      default:
        return '';
    }
  }
}
