import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Header } from '../../share-ui-blocks/header/header';

@Component({
  selector: 'app-header-only',
  imports: [RouterModule, Header],
  templateUrl: './header-only.html',
  styleUrl: './header-only.scss',
})
export class HeaderOnly {

}
