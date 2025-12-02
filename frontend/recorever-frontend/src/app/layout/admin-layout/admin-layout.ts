import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; 
import { AdminSideBar} from './admin-side-bar/admin-side-bar'; 
import { Header } from '../../share-ui-blocks/header/header';

@Component({
  selector: 'app-admin-layout',
  standalone: true, 
  imports: [RouterOutlet, AdminSideBar, Header], 
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayout {

}