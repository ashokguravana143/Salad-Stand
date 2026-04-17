import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { DashboardComponent as AdminDashboardComponent } from './features/admin/dashboard.component';
import { DeliveryFormComponent } from './features/admin/delivery-form.component';
import { DeliveryManagementComponent } from './features/admin/delivery-management.component';
import { EarningsComponent as AdminEarningsComponent } from './features/admin/earnings.component';
import { MenuManagementComponent } from './features/admin/menu-management.component';
import { OrdersManagementComponent } from './features/admin/orders-management.component';
import { SaladFormComponent } from './features/admin/salad-form.component';
import { SettingsComponent } from './features/admin/settings.component';
import { LoginComponent } from './features/auth/login.component';
import { RegisterComponent } from './features/auth/register.component';
import { CartComponent } from './features/customer/cart.component';
import { CheckoutComponent } from './features/customer/checkout.component';
import { MenuComponent } from './features/customer/menu.component';
import { MyOrdersComponent } from './features/customer/my-orders.component';
import { OrderSuccessComponent } from './features/customer/order-success.component';
import { DashboardComponent as DeliveryDashboardComponent } from './features/delivery/dashboard.component';
import { EarningsComponent as DeliveryEarningsComponent } from './features/delivery/earnings.component';
import { MyDeliveriesComponent } from './features/delivery/my-deliveries.component';
import { HomeComponent } from './features/home/home.component';
import { ShellComponent } from './shared/components/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'menu', component: MenuComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'cart', component: CartComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'order-success', component: OrderSuccessComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'orders/my', component: MyOrdersComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_CUSTOMER'] } },
      { path: 'admin/dashboard', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/orders', component: OrdersManagementComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/menu', component: MenuManagementComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/menu/add', component: SaladFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/menu/edit/:id', component: SaladFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/manage-dboy', component: DeliveryManagementComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/delivery-boys/add', component: DeliveryFormComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/settings', component: SettingsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'admin/earnings', component: AdminEarningsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_ADMIN'] } },
      { path: 'delivery/dashboard', component: DeliveryDashboardComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_DELIVERY_BOY'] } },
      { path: 'delivery/my-deliveries', component: MyDeliveriesComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_DELIVERY_BOY'] } },
      { path: 'delivery/my-earnings', component: DeliveryEarningsComponent, canActivate: [authGuard, roleGuard], data: { roles: ['ROLE_DELIVERY_BOY'] } }
    ]
  }
];
