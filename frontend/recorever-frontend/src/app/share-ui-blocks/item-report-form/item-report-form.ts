import { Component, Input, Output, EventEmitter, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormArray
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
    Report,
    ItemReportForm as ItemFormType,
    StandardLocations,
    ReportSubmissionPayload,
    ReportSubmissionWithFiles,
    FilePreview
} from '../../models/item-model';
import { ToastService } from '../../core/services/toast-service';

@Component({
  selector: 'app-item-report-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './item-report-form.html',
  styleUrl: './item-report-form.scss',
})
export class ItemReportForm implements OnInit {

  @Input() existingItemData?: Report;
  @Input() formType: 'lost' | 'found' = 'lost';

  @Output() formSubmitted = new EventEmitter<ReportSubmissionWithFiles>();
  @Output() formCancelled = new EventEmitter<void>();

  protected isCustomLocationModalOpen = false;
  protected selectedFiles: File[] = [];
  protected selectedFilesPreview: FilePreview[] = [];
  protected reportForm: ItemFormType;
  protected locationOptions = Object.values(StandardLocations);
  protected filteredLocations!: Observable<string[]>;

  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  // Getters
  public get locationLabel(): string {
    return this.formType === 'lost' ? 'Location Lost:' : 'Location Found:';
  }

  public get dateLabel(): string {
    return this.formType === 'lost' ? 'Date Lost:' : 'Date Found:';
  }

  private get photoUrlsFormArray(): FormArray<FormControl<string | null>> {
    return this.reportForm.controls.photoUrls;
  }

  constructor() {
    this.reportForm = this.fb.group({
      item_name: ['', {
        validators: [Validators.required, Validators.maxLength(100)],
        updateOn: 'blur'
      }],
      location: [
        '',
        { validators: [Validators.required] }
      ],
      date_lost_found: ['', { validators: [Validators.required] }],
      description:
          ['', { validators: [Validators.required, Validators.minLength(10),
              Validators.maxLength(500)]
      }],
      photoUrls: this.fb.array<FormControl<string | null>>([])
    }) as ItemFormType;
  }

  ngOnInit(): void {
    this.filteredLocations =
        this.reportForm.controls.location.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => this.filterLocations(value || ''))
    );

    if (this.existingItemData) {
      this.reportForm.patchValue({
        item_name: this.existingItemData.item_name,
        location: this.existingItemData.location,
        date_lost_found: this.existingItemData.date_lost_found ||
            this.existingItemData.date_reported,
        description: this.existingItemData.description
      });

      if (this.existingItemData.photoUrls) {
        this.existingItemData.photoUrls.forEach((url: string) => {
          this.photoUrlsFormArray.push(this.fb.control<string | null>(url));
        });
      }
    }

  }

  private filterLocations(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.locationOptions.filter((option: string) =>
      option.toLowerCase().includes(filterValue)
    );
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const maxPhotos = 5;
    const maxSizeInBytes = 10 * 1024 * 1024;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const currentTotal = this.selectedFiles.length +
          this.photoUrlsFormArray.length;

        if (currentTotal >= maxPhotos) {
          this.toastService.showError("Maximum of 5 photos only.");
          break;
        }

        if (file.size > maxSizeInBytes) {
          this.toastService.showError(`File ${file.name} is too large. Max size is 10MB.`);
          continue;
        }

        if (!file.type.match('image/(jpeg|png)')) {
          this.toastService.showError("Only JPEG and PNG images are supported.");
          continue;
        }

        const url = URL.createObjectURL(file);
        this.selectedFiles.push(file);
        this.selectedFilesPreview.push({
            file: file, url: url, name: file.name });
      }
      input.value = '';
    }
  }

  removeLocalPhoto(index: number): void {
    URL.revokeObjectURL(this.selectedFilesPreview[index].url);

    this.selectedFilesPreview.splice(index, 1);
    this.selectedFiles.splice(index, 1);
  }

  removeExistingPhoto(index: number): void {
    this.photoUrlsFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.reportForm.valid) {
      const basePayload: ReportSubmissionPayload = {
        type: this.formType,
        item_name: this.reportForm.controls.item_name.value!,
        location: this.reportForm.controls.location.value!,
        description: this.reportForm.controls.description.value!,
      };

      const finalPayload: ReportSubmissionWithFiles = {
        ...basePayload,
        status: 'pending',
        date_lost_found: this.reportForm.controls.date_lost_found.value!,
        date_reported: new Date().toISOString(),
        photoUrls: this.photoUrlsFormArray.value.filter((url):
            url is string => url !== null),
        files: this.selectedFiles,
      };

      this.formSubmitted.emit(finalPayload);

      this.selectedFilesPreview.forEach((p: FilePreview) =>
          URL.revokeObjectURL(p.url));
      this.selectedFiles = [];
      this.selectedFilesPreview = [];

    } else {
      this.reportForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.formCancelled.emit();
  }
}