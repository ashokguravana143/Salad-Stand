import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/services/auth.service';
import { LocationService } from './core/services/location.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
export class AppComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly location = inject(LocationService);

  ngOnInit(): void {
    this.auth.hydrateCurrentUser();
    void this.location.ensureInitialized();
  }
}
