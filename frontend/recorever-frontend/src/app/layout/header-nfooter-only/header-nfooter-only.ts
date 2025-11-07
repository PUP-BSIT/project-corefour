import { Component } from '@angular/core';
import { Footer } from '../../share-ui-blocks/footer/footer';
import { Header } from '../../share-ui-blocks/header/header';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header-nfooter-only',
  imports: [RouterModule, Footer, Header],
  templateUrl: './header-nfooter-only.html',
  styleUrl: './header-nfooter-only.scss',
})
export class HeaderNFooterOnly {

}
