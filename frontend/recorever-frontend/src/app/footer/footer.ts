import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FooterLink {
  label: string;
  url: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {

  protected siteLinks: FooterLink[] = [
    { label: 'Lost', url: '/lost' },
    { label: 'Report Lost', url: '/report/lost' },
    { label: 'Found', url: '/found' },
    { label: 'Report Found', url: '/report/found' },
  ];

  protected helpLinks: FooterLink[] = [
    { label: 'Customer Support', url: '/support' },
    { label: 'Terms & Conditions', url: '/terms' },
    { label: 'Privacy Policy', url: '/privacy' },
  ];

  protected mainLinks: FooterLink[] = [
    { label: 'Github', url: 'https://github.com/PUP-BSIT/project-corefour' },
    { label: 'About Us', url: '/about' },
  ];
}