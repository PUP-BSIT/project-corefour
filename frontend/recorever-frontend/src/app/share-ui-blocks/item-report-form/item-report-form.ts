import { Component, Input, Output, EventEmitter, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormControl, 
  FormArray,
  AbstractControl,
  ValidationErrors
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIcon } from "@angular/material/icon";
import { ToastService } from '../../core/services/toast-service';
import { environment } from '../../../environments/environment';

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
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatIcon
],
  templateUrl: './item-report-form.html',
  styleUrl: './item-report-form.scss',
})
export class ItemReportForm implements OnInit {

  @Input() initialData?: Report | null;
  @Input() isEditMode = false;
  @Input() formType: 'lost' | 'found' = 'lost';

  @Output() formSubmitted = new EventEmitter<ReportSubmissionWithFiles>();
  @Output() formCancelled = new EventEmitter<void>();

  protected isCustomLocationModalOpen = false;
  protected selectedFiles: File[] = [];
  protected selectedFilesPreview: FilePreview[] = [];
  protected reportForm: ItemFormType;
  protected locationOptions = Object.values(StandardLocations);
  protected filteredLocations!: Observable<string[]>;
  protected maxDate = new Date();
  protected isSubmitting = false;
  protected loadingMessage = 'Submitting...';
  protected submissionError: string | null = null;

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

  protected get descriptionCharCount(): number {
    const value = this.reportForm.controls.description.value || '';
    return value.replace(/\s/g, '').length;
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
      date_lost_found: [new Date().toISOString() as any, {
        validators: [
          Validators.required,
          (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) return null;

            const selectedDate = new Date(control.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            return selectedDate > today ? { futureDate: true } : null;
          }
        ] 
      }],
      description: ['', { 
        validators: [
          Validators.required,
          (control: AbstractControl): ValidationErrors | null => {
            const value = control.value || '';
            const noSpacesLength = value.replace(/\s/g, '').length;
            return noSpacesLength < 10 ? { minLengthNoSpaces: true } : null;
          },
          Validators.maxLength(500) 
        ]
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

    if (this.initialData) {
      const rawDate = this.initialData.date_lost_found
        || this.initialData.date_reported;
      const formattedDate = rawDate ? new Date(rawDate)
        .toISOString().split('T')[0] : '';

      this.reportForm.patchValue({
        item_name: this.initialData.item_name,
        location: this.initialData.location,
        date_lost_found: formattedDate,
        description: this.initialData.description
      });

      if (this.initialData.photoUrls || this.initialData.images) {
        this.photoUrlsFormArray.clear();
        
        const existingImages = this.initialData.images 
          ? this.initialData.images.map(img => img.imageUrl)
          : this.initialData.photoUrls || [];

        existingImages.forEach((url: string) => {
          let displayUrl = url;

          if (url && !url.startsWith('http')) {
            const secureBaseUrl = environment
                .apiUrl.replace('http://', 'https://');
            displayUrl = `${secureBaseUrl}/image/download/${url}`;
          } 
          else if (url && url.startsWith('http://')) {
            displayUrl = url.replace('http://', 'https://');
          }
          
          this.photoUrlsFormArray.push(this.fb.control(displayUrl));
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
    if (this.reportForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.loadingMessage = 'Submitting...';

      const formatDateForMySQL = (dateInput: any): string => {
        const d = new Date(dateInput);
        return d.toISOString().slice(0, 19).replace('T', ' ');
      };

      const cleanedPhotoUrls = this.photoUrlsFormArray.value
        .filter((url): url is string => !!url)
        .map(url => {
          if (url.includes('/image/download/')) {
            return url.split('/image/download/')[1];
          }
          return url;
        });

      const basePayload: ReportSubmissionPayload = {
        type: this.formType,
        item_name: this.reportForm.controls.item_name.value!,
        location: this.reportForm.controls.location.value!,
        description: this.reportForm.controls.description.value!,
      };

      const finalPayload: ReportSubmissionWithFiles = {
        ...basePayload,
        report_id: this.isEditMode ? this.initialData?.report_id : undefined,
        status: 'pending',
        date_lost_found:
          formatDateForMySQL(this.reportForm.controls.date_lost_found.value!), 
        date_reported: formatDateForMySQL(new Date()), 
        photoUrls: cleanedPhotoUrls,
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

  public handleSubmissionError(errorMessage: string): void {
    this.isSubmitting = false;
    this.submissionError = errorMessage;
  }

  onCancel(): void {
    this.reportForm.reset({
      date_lost_found: new Date().toISOString() as any,
    });

    this.photoUrlsFormArray.clear();
    this.selectedFilesPreview.forEach((p: FilePreview) =>
      URL.revokeObjectURL(p.url));
    this.selectedFiles = [];
    this.selectedFilesPreview = [];
  }
}