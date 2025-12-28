import {
  Component,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  TeamMemberCard
} from './team-member-card/team-member-card';

@Component({
  selector: 'app-about-us-page',
  standalone: true,
  imports: [CommonModule, TeamMemberCard],
  templateUrl: './about-us-page.html',
  styleUrl: './about-us-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AboutUsPage {
  readonly missionTitle = signal<string>('Our Mission');
  readonly missionText = signal<string>(
    'To streamline the lost and found process within the PUP community ' +
    'through an accessible, efficient, and transparent digital platform.'
  );

  readonly visionTitle = signal<string>('Our Vision');
  readonly visionText = signal<string>(
    'A campus where every lost item finds its way back to its owner, ' +
    'fostering a culture of honesty and community support.'
  );
}