import { 
  Component, 
  EventEmitter, 
  Input, 
  OnInit, 
  Output, 
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  FormBuilder, 
  FormGroup, 
  ReactiveFormsModule, 
  Validators 
} from '@angular/forms';
import { User } from '../../models/user-model';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule ],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.scss'
})
export class EditProfileModal implements OnInit {
  private fb = inject(FormBuilder);

  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  
  @Output() save = new EventEmitter<{ user: User, file: File | null }>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  editForm!: FormGroup;
  isSubmitting = false;
  previewImage: string | null = null;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.editForm = this.fb.group({
      name: [this.user?.name || '', [Validators.required]],
      phone_number: [this.user?.phone_number || '', [Validators.required]],
      email: [
        this.user?.email || '', 
        [Validators.required, Validators.email]
      ]
    });

    if (this.user?.profile_picture) {
        this.previewImage = this.user.profile_picture;
    }
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
    }
  }

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }
}