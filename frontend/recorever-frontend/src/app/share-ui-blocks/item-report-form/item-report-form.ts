import { Component, Input, Output, EventEmitter, OnInit, inject }
    from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl }
    from '@angular/forms';
import {
    Report,
    ItemReportForm as ItemFormType,
    StandardLocations,
    FinalReportSubmission,
    ReportSubmissionPayload
} from '../../models/item-model';
import { CustomLocation }
    from '../../modal/custom-location/custom-location';

@Component({
  selector: 'app-item-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CustomLocation],
  templateUrl: './item-report-form.html',
  styleUrl: './item-report-form.scss',
})
export class ItemReportForm implements OnInit {

  protected isCustomLocationModalOpen: boolean = false;

  private fb = inject(FormBuilder);

  @Input() existingItemData?: Report;
  @Input() formType: 'lost' | 'found' = 'lost';

  @Output() formSubmitted = new EventEmitter<FinalReportSubmission>();
  @Output() formCancelled = new EventEmitter<void>();

  public get locationLabel(): string {
    return this.formType === 'lost' ? 'Location Lost:' :
        'Location Found:';
  }

  public get dateLabel(): string {
    return this.formType === 'lost' ? 'Date Lost:' : 'Date Found:';
  }

  protected reportForm: ItemFormType;
  protected locationOptions = Object.values(StandardLocations);

  constructor() {
    this.reportForm = this.fb.group({
      item_name: ['', { validators:
          [Validators.required, Validators.maxLength(100)],
          updateOn: 'blur' }],
      location: [
        StandardLocations.ZONTA_PARK,
        { validators: [Validators.required] }
      ],
      date_reported: ['',
        { validators: [Validators.required] }],
      description: ['',
        { validators: [Validators.required, Validators.minLength(10),
          Validators.maxLength(500)] }],
      photoUrls: this.fb.array([])
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
    }

    this.reportForm.controls.location.valueChanges.subscribe
        ((value: string | null) => {
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

  onSubmit(): void {
      if (this.reportForm.valid) {
        const apiPayload: ReportSubmissionPayload = {
            type: this.formType,
            item_name: this.reportForm.controls.item_name.value!,
            location: this.reportForm.controls.location.value!,
            description: this.reportForm.controls.description.value!,
        };

        this.formSubmitted.emit(apiPayload as FinalReportSubmission);
      } else {
        this.reportForm.markAllAsTouched();
      }
    }

    onCancel(): void {
      this.formCancelled.emit();
    }
  }