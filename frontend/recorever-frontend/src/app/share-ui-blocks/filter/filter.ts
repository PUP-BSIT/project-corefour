import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith
} from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export type FilterState = {
  sort: 'newest' | 'oldest';
  date: Date | null;
  location: string;
};

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule
  ],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
  encapsulation: ViewEncapsulation.None
})
export class Filter implements OnInit {
  @Input() public locations: string[] = [];
  @Input() public itemType: 'lost' | 'found' = 'lost';
  @Input() public genericLabels: boolean = false;

  @Output() public filterChange = new EventEmitter<FilterState>();

  protected filterForm: FormGroup;
  protected isDefaultState = signal<boolean>(true);
  protected filteredLocations$: Observable<string[]> = of([]);

  protected dateLabel = computed((): string => {
    if (this.genericLabels) {
      return 'Date';
    }
    return this.itemType === 'found' ? 'Date Found' : 'Date Lost';
  });

  protected locationLabel = computed((): string => {
    if (this.genericLabels) {
      return 'Location';
    }
    return this.itemType === 'found' ? 'Location Found' : 'Location Lost';
  });

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      sort: ['newest'],
      date: [null],
      location: ['']
    });
  }

  public ngOnInit(): void {
    const locControl = this.filterForm.get('location');

    if (locControl) {
      this.filteredLocations$ = locControl.valueChanges.pipe(
        startWith(''),
        map(value => this.filterLocations(value || ''))
      );
    }

    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged((prev, curr) => {
          return JSON.stringify(prev) === JSON.stringify(curr);
        })
      )
      .subscribe((value: Partial<FilterState>) => {
        this.updateDefaultState(value);
        this.emitFilter(value);
      });
  }

  protected resetFilters(): void {
    this.filterForm.patchValue({
      sort: 'newest',
      date: null,
      location: ''
    });
  }

  private filterLocations(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.locations.filter(option =>
      option.toLowerCase().includes(filterValue)
    );
  }

  private updateDefaultState(formValue: Partial<FilterState>): void {
    const isLocationEmpty = !formValue.location || formValue.location === '';
    const isDefault =
      formValue.sort === 'newest' &&
      formValue.date === null &&
      isLocationEmpty;

    this.isDefaultState.set(isDefault || false);
  }

  private emitFilter(formValue: Partial<FilterState>): void {
    this.filterChange.emit({
      sort: (formValue.sort as 'newest' | 'oldest') || 'newest',
      date: formValue.date || null,
      location: formValue.location || ''
    });
  }
}