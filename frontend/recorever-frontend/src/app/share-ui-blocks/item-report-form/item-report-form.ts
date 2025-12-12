import { Component, Input, Output, EventEmitter, OnInit, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormArray
} from '@angular/forms';
import {
    Report,
    ItemReportForm as ItemFormType,
    StandardLocations,
    ReportSubmissionPayload,
    ReportSubmissionWithFiles,
    FilePreview
} from '../../models/item-model';
import { CustomLocation} from '../../modal/custom-location/custom-location';

@Component({
  selector: 'app-item-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomLocation],
  templateUrl: './item-report-form.html',
  styleUrl: './item-report-form.scss',
})
export class ItemReportForm implements OnInit {

  // Inputs
  @Input() existingItemData?: Report;
  @Input() formType: 'lost' | 'found' = 'lost';

  // Outputs
  @Output() formSubmitted = new EventEmitter<ReportSubmissionWithFiles>();
  @Output() formCancelled = new EventEmitter<void>();

  // Protected Properties
  protected isCustomLocationModalOpen = false;
  protected selectedFiles: File[] = [];
  protected selectedFilesPreview: FilePreview[] = [];
  protected reportForm: ItemFormType;
  protected locationOptions = Object.values(StandardLocations);

  // Private Properties
  private fb = inject(FormBuilder);

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
        StandardLocations.ZONTA_PARK,
        { validators: [Validators.required] }
      ],
      date_reported: ['', { validators: [Validators.required] }],
      description:
          ['', { validators: [Validators.required, Validators.minLength(10),
              Validators.maxLength(500)]
      }],
      photoUrls: this.fb.array<FormControl<string | null>>([])
    }) as ItemFormType;
  }

  ngOnInit(): void {
    if (this.existingItemData) {
      this.reportForm.patchValue({
        item_name: this.existingItemData.item_name,
        location: this.existingItemData.location,
        date_reported: this.existingItemData.date_reported,
        description: this.existingItemData.description
      });

      if (this.existingItemData.photoUrls) {
        this.existingItemData.photoUrls.forEach((url: string) => {
          this.photoUrlsFormArray.push(this.fb.control<string | null>(url));
        });
      }
    }

    this.reportForm.controls.location.valueChanges.subscribe
        ((value: string | null): void => {
      if (value === StandardLocations.OTHERS) {
        this.openCustomLocationModal();
      }
    });
  }

  openCustomLocationModal(): void {
    this.isCustomLocationModalOpen = true;
  }

  handleCustomLocationSelected(location: string): void {
    this.reportForm.controls.location.setValue(location);
    this.isCustomLocationModalOpen = false;
  }

  handleCustomLocationClose(): void {
    this.reportForm.controls.location.setValue(StandardLocations.ZONTA_PARK);
    this.isCustomLocationModalOpen = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.match('image/(jpeg|png)')) {
          console.error(`File type not supported: ${file.name}`);
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
        date_reported: this.reportForm.controls.date_reported.value!,
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