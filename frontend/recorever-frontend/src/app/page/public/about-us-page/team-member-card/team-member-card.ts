import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-team-member-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-member-card.html',
  styleUrl: './team-member-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamMemberCard {
}