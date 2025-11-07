import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule
  ]
})
export class SearchBarComponent {
  @Output() search = new EventEmitter<string>();
  searchControl = new FormControl('');

  onSearch(): void {
    const searchTerm = this.searchControl.value || '';
    this.search.emit(searchTerm);
  }
}