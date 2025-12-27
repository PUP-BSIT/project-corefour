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
import type { User } from '../../models/user-model';
import { UserService } from '../../core/services/user-service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss'
})
export class EditProfileModal implements OnInit, OnChanges, OnDestroy {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);

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
      name: [''],
      phone_number: [''],
      email: ['']
    });
  }

  ngOnInit(): void {
    this.initializeForm();
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

    this.editForm = this.fb.group({
      name: [
        this.user.name, 
        {
          validators: [Validators.required],
          asyncValidators: [this.userService.uniqueValidator('name', this.user.name)],
        }
      ],
      phone_number: [
        this.user.phone_number, 
        {
          validators: [Validators.required, this.phPhoneNumberValidator()],
          asyncValidators: [this.userService.uniqueValidator('phone_number', this.user.phone_number)],
        }
      ],
      email: [
        this.user.email, 
        {
          validators: [Validators.required, Validators.email],
          asyncValidators: [this.userService.uniqueValidator('email', this.user.email)],
        }
      ]
    });

    if (this.sub) {
      this.sub.unsubscribe();
    }
    this.sub = this.editForm.valueChanges.subscribe(() => {
      if (this.localError) {
        this.localError = null;
      }
    });

  if (this.user.profile_picture) {
    this.previewImage = `${environment.apiUrl}/image/download/${this.user.profile_picture}`;
  } else {
    this.previewImage = null;
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

      this.previewImage = URL.createObjectURL(file);
      
      this.editForm.markAsDirty();
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}