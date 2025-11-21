import { Component, Input, Output, EventEmitter, OnInit, inject }
    from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl }
    from '@angular/forms';
import {
    Report,
    ItemReportForm as ItemFormType,
    StandardLocations,
    FinalReportSubmission
} from '../../models/item-model';


@Component({
  selector: 'app-item-report-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-report-form.html',
  styleUrl: './item-report-form.scss',
})
export class ItemReportForm implements OnInit {

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
      item_name: [
        this.existingItemData?.item_name || '',
        { validators: [Validators.required, Validators.maxLength(100)],
            updateOn: 'blur' }
      ],
      location: [
        this.existingItemData?.location || StandardLocations.ZONTA_PARK,
        { validators: [Validators.required] }
      ],
      date_reported: [
        this.existingItemData?.date_reported || '',
        { validators: [Validators.required] }
      ],
      description: [
        this.existingItemData?.description || '',
        { validators: [Validators.required, Validators.minLength(100),
            Validators.maxLength(500)] }
      ],
      photoUrls: this.fb.array([])
    }) as ItemFormType;
  }

  ngOnInit(): void {
    if (this.existingItemData) {
      this.reportForm.patchValue(this.existingItemData);
    }

    this.reportForm.controls.location.valueChanges.subscribe(value => {
      if (value === StandardLocations.OTHERS) {
        this.openCustomLocationModal();
      }
    });
  }

  openCustomLocationModal(): void {
    console.log("Custom location modal requested (ModalService call" +
        "required here).");
  }


  onSubmit(): void {
    if (this.reportForm.valid) {
      const formValue: FinalReportSubmission = {
          type: this.formType,
          status: 'pending',
          item_name: this.reportForm.controls.item_name.value!,
          location: this.reportForm.controls.location.value!,
          date_reported: this.reportForm.controls.date_reported.value!,
          description: this.reportForm.controls.description.value!,
          photoUrls: [],
      };

      this.formSubmitted.emit(formValue);
    } else {
      this.reportForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.reportForm.reset();
  }
}