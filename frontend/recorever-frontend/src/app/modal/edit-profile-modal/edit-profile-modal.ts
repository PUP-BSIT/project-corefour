import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { User } from '../../models/user-model';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss'
})
export class EditProfileModal implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);

  @Input() user: User | null = null;
  @Input() errorMessage: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ user: User, file: File | null }>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  editForm!: FormGroup;
  isSubmitting = false;
  previewImage: string | null = null;
  selectedFile: File | null = null;
  
  localError: string | null = null;
  private sub: Subscription | null = null;

  constructor() {
    this.editForm = this.fb.group({
      name: ['', [Validators.required]],
      phone_number: ['', [Validators.required, this.phPhoneNumberValidator()]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    
    const emailControl = this.editForm.get('email');
    if (emailControl) {
      this.sub = emailControl.valueChanges.subscribe(() => {
        if (this.localError) {
          this.localError = null;
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.initializeForm();
    }

    if (changes['errorMessage']) {
      this.localError = this.errorMessage;
      if (this.localError) {
        this.isSubmitting = false;
      }
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

  private phPhoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        return null; 
      }

      const valid = /^09\d{9}$/.test(value);
      return valid ? null : { invalidPhNumber: true };
    };
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.editForm.get('phone_number')?.setValue(input.value);
  }

  private initializeForm(): void {
    if (!this.user) return;

    this.editForm.reset({
      name: this.user.name,
      phone_number: this.user.phone_number,
      email: this.user.email
    });

    this.editForm.markAsPristine();

    if (this.user.profile_picture) {
      this.previewImage = this.user.profile_picture;
    }
    
    this.selectedFile = null;
    this.localError = null;
    this.isSubmitting = false;
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    if (this.editForm.valid && this.user) {
      this.isSubmitting = true;

      const updatedUser: User = {
        ...this.user,
        ...this.editForm.value,
        profile_picture: this.user.profile_picture
      };

      this.save.emit({ user: updatedUser, file: this.selectedFile });
    } else {
      this.editForm.markAllAsTouched();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewImage = e.target?.result as string;
      };
      reader.readAsDataURL(file);
      
      this.editForm.markAsDirty();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}