import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd, NavigationStart, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { AuthSignal } from './core/auth/auth-signal';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
declare const NotificationSignalR: any;
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    MatTooltipModule,
    MatIconModule,
    MatBadgeModule,
    FormsModule
  ],
  templateUrl: './app.html'
})
export class App implements OnInit {

  username: string | null = null;
  email: string | null = null;
  role: string | null = null;
  isLoggedIn = false;
  showUserMenu = false;
  showHeader = true;
  showFooter = true;
  notifications: any[] = [];
  unreadCount = 0;
  showNotifications = false;
  inLoginPage=false;
  notificationSearch = '';
  pnrValue: string = '';
  isNavigating = false;
  constructor(
    private router: Router,
    private api: Api_Calls,
    private authSignal: AuthSignal,
    private location:Location,
    private toastr:ToastrService
  ) { }


ngOnInit(): void {

  this.authSignal.restoreFromStorage();
  this.loadUser();
  const token = this.authSignal.getToken();

  if (token == null) {
    this.logout();
  }

  // Handle initial page load (important for refresh)
  const currentUrl = this.router.url;

  this.inLoginPage =
    currentUrl.startsWith('/login') ||
    currentUrl.startsWith('/register');

  this.showHeader = !this.inLoginPage;
  this.showFooter = !this.inLoginPage;

  //  Initialize SignalR if already logged in
  if (token && this.isLoggedIn) {
    this.initializeSignalR(token);
    this.loadUnreadCount();
  }

  // Listen for route changes
  this.router.events
    .subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        this.isNavigating = true;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.isNavigating = false;
      }

      if (!(event instanceof NavigationEnd)) return;

      const url = event.urlAfterRedirects;

      // Detect login/register page
      this.inLoginPage =
        url.startsWith('/login') ||
        url.startsWith('/register');

      this.showHeader = !this.inLoginPage;
      this.showFooter = !this.inLoginPage;

      const wasLoggedIn = this.isLoggedIn;
      this.loadUser();

      if (this.isLoggedIn && !wasLoggedIn) {
        const token = this.authSignal.getToken();

        if (token) {
          this.initializeSignalR(token);
          this.loadUnreadCount();
        }
      }
    });
}

initializeSignalR(token: string) {

  NotificationSignalR.start(
    token,

    // When notification comes
    (data: any) => {

      console.log("Notification received:", data);

      this.notifications.unshift({
        notificationId: data.notificationId ?? 0,
        title: data.title,
        message: data.message,
        createdOn: data.createdOn,
        isRead: false
      });

      
    },

    // When unread count pushed from backend
    (count: number) => {

      console.log("Unread count received:", count);

      this.unreadCount = count;
    }
  );
}
  /* ---------------- USER ---------------- */

  loadUser() {

  const user = this.authSignal.user();

  this.username = user?.name ?? null;
  this.email = user?.email ?? null;
  this.role = user?.role ?? null;

  this.isLoggedIn = !!this.username;
}

  /* ---------------- NOTIFICATIONS ---------------- */
  loadUnreadCount() {
    if (!this.isLoggedIn) return;
    this.api.getUnreadCount().subscribe(res => {
      if (res?.status) {
        this.unreadCount = res.data;
      }
    });
  }
toggleNotifications() {
  this.showNotifications = !this.showNotifications;

  if (this.showNotifications) {
    this.api.getMyNotifications().subscribe(res => {
      if (res?.status) {
        this.notifications = res.data;
      }
    });
  }
}


  markAsRead(notification: any) {
    if (notification.isRead) return;

    this.api.markAsRead(notification.notificationId).subscribe(() => {
      notification.isRead = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }

  // ----------------------- Navigation to notifications page ---------------------//

goToNotificationsPage() {

  const unread = this.notifications.filter(n => !n.isRead);

  if (unread.length === 0) {
    this.router.navigate(['/notifications']);
    return;
  }

  // Mark all as read in backend
  unread.forEach(n => {
    this.api.markAsRead(n.notificationId).subscribe();
    n.isRead = true;
  });

  // Immediately update UI count
  this.unreadCount = 0;

  this.showNotifications = false;

  this.router.navigate(['/notifications']);
}

  gotostops() {
    this.router.navigate(['/stop']);
  }
  /* ---------------- SEARCH ---------------- */
  filteredNotifications() {
    if (!this.notificationSearch) return this.notifications;

    const q = this.notificationSearch.toLowerCase();
    return this.notifications.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q)
    );
  }

  markAndRemove(notification: any) {
    if (notification.isRead) {
      this.notifications =
        this.notifications.filter(n => n !== notification);
      return;
    }

    this.api.markAsRead(notification.notificationId).subscribe(() => {
      this.notifications =
        this.notifications.filter(n => n !== notification);

      this.unreadCount = Math.max(0, this.unreadCount - 1);
    });
  }
  /* ---------------- NAVIGATION ---------------- */
  goToLogin() {
    if(!this.isLoggedIn)
    this.router.navigate(['/login']);
  else
    this.toastr.warning('User already logged in');
  }
  goToRegister() { this.router.navigate(['/register']); }
  gotohelp() {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/help']);
  }
  gotobookings() {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/bookings']);
  }
  userprofile() {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/userprofile']);
  }

  accountView() { this.showUserMenu = true; }
  closeAccountView() { this.showUserMenu = false; }

  gotohome() {
    sessionStorage.removeItem('transportMode');
    this.router.navigate(['/dashboard']);
  }
  logout() {
    sessionStorage.clear();

    this.username = null;
    this.email = null;
    this.role = null;
    this.isLoggedIn = false;
    this.showUserMenu = false;
    this.showNotifications = false;
    this.unreadCount = 0;
    this.authSignal.clear();
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      sessionStorage.removeItem('transportMode');
      this.router.navigate(['/dashboard']);
    }
    )
  }

  closeNotifications() {
    this.showNotifications = false;
  }
  gotoroutes(){
    this.router.navigate(['manageroutes']);
  }
goback(): void {
  if (window.history.length > 1) {
    this.location.back();
  } else {
    this.router.navigate(['/dashboard']);
  }
  
}
gotoLogs(){
this.router.navigate(['/logs']);
  }
  onPNRInput() {
  if (!this.pnrValue) return;

  // remove non-digits
  this.pnrValue = this.pnrValue.replace(/[^0-9]/g, '');

  // limit to 10 digits
  if (this.pnrValue.length > 10) {
    this.pnrValue = this.pnrValue.slice(0, 10);
  }
}
searchPNR() {

  const pnr = this.pnrValue?.trim();
  const isValidPNR = /^[0-9]{10}$/.test(pnr);

  if (!isValidPNR) {
    return;
  }

  sessionStorage.setItem('pnr', pnr);

  this.router.navigate(['/pnr']);

  this.pnrValue = '';
}
}
