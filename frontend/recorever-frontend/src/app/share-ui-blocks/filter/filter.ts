import {
  Component,
  EventEmitter,
  input,
  OnInit,
  Output,
  ViewEncapsulation,
  signal,
  computed,
  inject,
  ElementRef,
  Renderer2,
  DestroyRef
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
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
import { ScrollDispatcher, ScrollingModule, CdkScrollable } from '@angular/cdk/scrolling';

import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith
} from 'rxjs/operators';
import { Observable, of, combineLatest } from 'rxjs';

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
    MatAutocompleteModule,
    ScrollingModule
  ],
  templateUrl: './filter.html',
  styleUrl: './filter.scss',
  encapsulation: ViewEncapsulation.None
})
export class Filter implements OnInit {
  public locations = input<string[]>([]);
  public itemType = input<'lost' | 'found'>('lost');
  public genericLabels = input<boolean>(false);

  @Output() public filterChange = new EventEmitter<FilterState>();

  protected filterForm: FormGroup;
  protected isDefaultState = signal<boolean>(true);
  protected isFilterVisible = signal<boolean>(false);
  protected filteredLocations$: Observable<string[]> = of([]);

  private locations$ = toObservable(this.locations);

  private scrollDispatcher = inject(ScrollDispatcher);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);
  private destroyRef = inject(DestroyRef);

  protected dateLabel = computed((): string => {
    if (this.genericLabels()) {
      return 'Date';
    }
    return this.itemType() === 'found' ? 'Date Found' : 'Date Lost';
  });

  protected locationLabel = computed((): string => {
    if (this.genericLabels()) {
      return 'Location';
    }
    return this.itemType() === 'found' ? 'Location Found' : 'Location Lost';
  });

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      sort: ['newest'],
      date: [null],
      location: ['']
    });

    this.destroyRef.onDestroy(() => {
      this.toggleParentScroll(true);
    });
  }

  public ngOnInit(): void {
    const locControl = this.filterForm.get('location');

    if (locControl) {
      this.filteredLocations$ = combineLatest([
        locControl.valueChanges.pipe(startWith(locControl.value || '')),
        this.locations$
      ]).pipe(
        map(([value, locations]) => {
          const filterValue = (value || '').toLowerCase();
          return locations
            .filter(option => option.toLowerCase().includes(filterValue))
            .slice(0, 5);
        })
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

  protected onLocationPanelOpened(): void {
    this.toggleParentScroll(false);
  }

  protected onLocationPanelClosed(): void {
    this.toggleParentScroll(true);
  }

  /**
  @param enable
   */
  private toggleParentScroll(enable: boolean): void {
    const scrollContainers =
        this.scrollDispatcher.getAncestorScrollContainers(this.elementRef);

    if (scrollContainers && scrollContainers.length > 0) {
      const containerRef = scrollContainers[0].getElementRef();
      const value = enable ? '' : 'hidden';

      this.renderer.setStyle(containerRef.nativeElement, 'overflow', value);
    }
  }

  protected resetFilters(): void {
    this.filterForm.patchValue({
      sort: 'newest',
      date: null,
      location: ''
    });
  }

  protected clearLocation(event: Event): void {
    event.stopPropagation();
    this.filterForm.get('location')?.setValue('');
  }

  protected toggleFilter(): void {
    this.isFilterVisible.update(value => !value);
  }

  private filterLocations(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.locations().filter(option =>
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