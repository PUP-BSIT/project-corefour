import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})

export class Header {
  @Input() showButtons: boolean = false;
  @Input() showMenuButton: boolean = false;

  @Output() menuToggled = new EventEmitter<void>();

  public toggleMenu(): void {
    this.menuToggled.emit();
  }
}