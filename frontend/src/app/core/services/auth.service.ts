import { Injectable, computed, signal } from '@angular/core';
import { tap } from 'rxjs/operators';

import { ApiClientService } from '../http/api-client.service';
import { AuthResponse, User } from '../models/app.models';

const TOKEN_KEY = 'saladstand_token';
const USER_KEY = 'saladstand_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenState = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  private readonly userState = signal<User | null>(this.readUser());

  readonly currentUser = computed(() => this.userState());
  readonly isAuthenticated = computed(() => !!this.userState());

  constructor(private readonly api: ApiClientService) {}

  login(payload: { email: string; password: string }) {
    return this.api.post<AuthResponse>('/auth/login', payload).pipe(
      tap((response) => this.persist(response))
    );
  }

  register(payload: { full_name: string; email: string; phone_number: string; password: string }) {
    return this.api.post<User>('/auth/register', payload);
  }

  hydrateCurrentUser() {
    if (!this.token()) {
      return;
    }
    this.api.get<User>('/auth/me').subscribe({
      next: (user) => {
        this.userState.set(user);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      },
      error: () => this.logout()
    });
  }

  logout() {
    this.tokenState.set(null);
    this.userState.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  token() {
    return this.tokenState();
  }

  private persist(response: AuthResponse) {
    this.tokenState.set(response.access_token);
    this.userState.set(response.user);
    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
