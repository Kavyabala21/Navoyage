import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Api_Calls } from 'src/Shared/Services/api-calls';
import { ToastrService } from 'ngx-toastr';
declare const NotificationSignalR: any;

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'notifications.html'
})
export class Notifications implements OnInit {

  notifications: any[] = [];
  loading = true;
  searchText = '';

  constructor(
    private api: Api_Calls,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
  this.loadNotifications();
}


  /* ---------------- LOAD ---------------- */
  loadNotifications() {
    this.loading = true;

    this.api.getAllMyNotifications().subscribe({
      next: (res: any) => {
        this.notifications = res.data || [];
        this.loading = false;
      },
      error: () => {
        this.toastr.error('Failed to load notifications');
        this.loading = false;
      }
    });
  }

  /* ---------------- FILTER ---------------- */
  get filteredNotifications() {
    if (!this.searchText) return this.notifications;

    const q = this.searchText.toLowerCase();

    return this.notifications.filter(n =>
      n.title?.toLowerCase().includes(q) ||
      n.message?.toLowerCase().includes(q)
    );
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
