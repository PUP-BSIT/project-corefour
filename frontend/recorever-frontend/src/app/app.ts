import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('recorever-frontend');
  
  constructor(private auth: AuthService) {}

  ngOnInit() {
    this.auth.initAuth().subscribe();
  }

}
