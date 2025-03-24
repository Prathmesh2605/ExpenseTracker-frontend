import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss']
})
export class CategoryFormComponent implements OnInit {
  form: FormGroup;
  isLoading = false;
  icons = [
    'category', 'shopping_cart', 'restaurant', 'local_taxi', 'home',
    'flight', 'hotel', 'movie', 'school', 'medical_services',
    'sports_esports', 'fitness_center', 'pets', 'card_giftcard'
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Category
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', Validators.maxLength(200)],
      color: ['#2196f3'],
      icon: ['category']
    });

    if (data) {
      this.form.patchValue(data);
    }
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.form.valid) {
      this.isLoading = true;
      const formValue = this.form.value;

      const request = this.data
        ? this.categoryService.updateCategory({ ...formValue, id: this.data.id })
        : this.categoryService.createCategory(formValue);

      request.subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
