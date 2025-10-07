import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminUser } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css', './admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  users: AdminUser[] = [];
  loading = true;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.admin.getUsers().subscribe({
      next: (res) => { this.users = res.users; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  changeRole(user: AdminUser, role: AdminUser['role']): void {
    if (user.role === role) return;
    this.admin.updateUserRole(user._id, role).subscribe({ next: () => this.fetchUsers() });
  }

  changeStatus(user: AdminUser, status: AdminUser['status']): void {
    if (user.status === status) return;
    this.admin.updateUserStatus(user._id, status).subscribe({ next: () => this.fetchUsers() });
  }
}


