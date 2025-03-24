import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule, type Routes } from "@angular/router"
import { NgChartsModule } from "ng2-charts"

import { DashboardComponent } from "./dashboard/dashboard.component"
import { expenseServiceProvider } from "../../core/services/expense-service.provider"

const routes: Routes = [{ path: "", component: DashboardComponent }]

@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, RouterModule.forChild(routes), NgChartsModule],
  providers: [expenseServiceProvider],
})
export class DashboardModule {}

