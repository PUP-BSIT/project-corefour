import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './help-page.html',
  styleUrls: ['./help-page.scss']
})
export class HelpPage {}