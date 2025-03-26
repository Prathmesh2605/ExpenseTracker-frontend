import { NgModule } from "@angular/core"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { NgChartsModule } from "ng2-charts"

import { DashboardComponent } from "./dashboard/dashboard.component"
import { expenseServiceProvider } from "../../core/services/expense-service.provider"
import { DashboardRoutingModule } from "./dashboard-routing.module"
import { LayoutsModule } from "../../layouts/layouts.module"

@NgModule({
  declarations: [DashboardComponent],
  imports: [
    CommonModule, 
    DashboardRoutingModule,
    NgChartsModule,
    LayoutsModule
  ],
  providers: [expenseServiceProvider],
})
export class DashboardModule {}
