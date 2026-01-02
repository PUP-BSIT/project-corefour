import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FooterLink {
  label: string;
  url: string;
  fragment?: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {

  protected helpLinks: FooterLink[] = [
    { 
      label: 'Customer Support', 
      url: '/help-page', 
      fragment: 'support' 
    },
    { 
      label: 'Terms & Conditions', 
      url: '/help-page', 
      fragment: 'terms' 
    },
    { 
      label: 'Privacy Policy', 
      url: '/help-page', 
      fragment: 'privacy' 
    },
  ];

  protected mainLinks: FooterLink[] = [
    { label: 'Github', url: 'https://github.com/PUP-BSIT/project-corefour' },
    { label: 'About Us', url: '/about-us' },
  ];
}