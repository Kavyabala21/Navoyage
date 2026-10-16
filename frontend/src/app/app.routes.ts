import { Routes } from '@angular/router';
import { noAuthGuard } from './core/auth/no-auth-guard';
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
   {
    path: 'login',
    loadComponent: () => import('./login/login').then(x => x.Login),
    canActivate: [noAuthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register').then(x => x.Register),
    canActivate: [noAuthGuard]
  },
  { path: 'dashboard', loadComponent: () => import('./dash-board/dash-board').then(x => x.Dashboard) },
  { path: 'userprofile', loadComponent: () => import('./user-profile/user-profile').then(x => x.UserProfile) },
  { path: 'help', loadComponent: () => import('./help/help').then(x => x.Help) },
  { path: 'bookings', loadComponent: () => import('./bookings/bookings').then(x => x.Bookings) },
  { path: 'search', loadComponent: () => import('./search/search').then(x => x.Search) },
  { path: 'vehicles', loadComponent: () => import('./vehicles/vehicles').then(x => x.Vehicles) },
  { path: 'admincontrols', loadComponent: () => import('./admin-controls/admin-controls').then(x => x.AdminControls) },
  { path: 'viewalldocuments', loadComponent: () => import('./view-all-documents/view-all-documents').then(x => x.ViewAllDocuments) },
  { path: 'allvehicles', loadComponent: () => import('./all-vehicles/all-vehicles').then(x => x.AllVehicles) },
  { path: 'vehicleinstance', loadComponent: () => import('./vehicle-instance/vehicle-instance').then(x => x.VehicleInstance) },
  { path: 'managevehicleinstance', loadComponent: () => import('./manage-vehicle-instance/manage-vehicle-instance').then(x => x.ManageVehicleInstance) },
  { path: 'seatlayout', loadComponent: () => import('./seat-layout/seat-layout').then(x => x.SeatLayout) },
  {path: 'bookingseatlayout/:vehicleId/:instanceId',loadComponent: () => import('./booking-seat-layout/booking-seat-layout').then(x => x.BookingSeatLayout)},
  { path: 'passengerform', loadComponent: () => import('./passenger-form/passenger-form').then(x => x.PassengerForm) },
  { path: 'notifications', loadComponent: () => import('./notifications/notifications').then(x => x.Notifications) },
  { path: 'reviews', loadComponent: () => import('./reviews/reviews').then(x => x.Reviews) },
  { path: 'stop', loadComponent: () => import('./stop/stop').then(x => x.Stop) },
  { path: 'manageroutes', loadComponent: () => import('./manage-routes/manage-routes').then(x => x.ManageRoutes) },
  { path: 'logs', loadComponent: () => import('./logs/logs').then(x => x.Logs) },
  { path: 'trainprices', loadComponent: () => import('./train-prices/train-prices').then(x => x.TrainPrices) },
  {path:'pnr',loadComponent:()=>import('./pnr/pnr').then(x=>x.pnr)},
  { path: '**', redirectTo: 'dashboard' },
  {path:'ai',loadComponent:()=>import('./ai/ai').then(x=>x.AiComponent)}
];