import { Provider } from '@angular/core';
import { ExpenseService } from './expense.service';
import { MockExpenseService } from './mock-expense.service';
import { environment } from '../../../environments/environment';

// Set this to true to use mock data instead of real API
const USE_MOCK_SERVICE = false; // Change to false when backend is ready

export const expenseServiceProvider: Provider = {
  provide: ExpenseService,
  useClass: USE_MOCK_SERVICE ? MockExpenseService : ExpenseService
};
