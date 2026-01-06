import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type PaginatedResponse<T> = {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
};

export type ReportStatus =
  | 'pending'
  | 'approved'
  | 'matched'
  | 'claimed'
  | 'closed'
  | 'rejected';

export type Report = {
  report_id: number;
  user_id: number;
  type: 'lost' | 'found';
  item_name: string;
  location: string;
  date_lost_found?: string;
  date_reported: string;
  date_posted?: string;
  date_resolved: string | null;
  description: string;
  status: ReportStatus;
  surrender_code: string | null;
  claim_code: string | null;
  expiry_date?: string;
  reporter_name?: string;
  remarks?: string;
  photoUrls?: string[];
  images?: { imageUrl: string; fileName: string }[];
  reporter_profile_picture?: string | null;
};

export type ReportFilters = {
  type?: 'lost' | 'found';
  status?: ReportStatus;
  location?: string;
  query?: string;
  user_id?: number;
  page?: number;
  size?: number;
};

export enum StandardLocations {
  ZONTA_PARK = 'Zonta Park',
  LOCATION_ONE = 'Location 1',
  LOCATION_TWO = 'Location 2',
  OTHERS = 'Others...',
}

export const StandardRelativeDateFilters: string[] = [
  'Past hour',
  'Past 24 hours',
  'Past week',
  'Past month',
  'Past year',
];

export type ItemReportForm = FormGroup<{
  item_name: FormControl<string | null>;
  location: FormControl<string | null>;
  date_lost_found: FormControl<string | null>;
  description: FormControl<string | null>;
  photoUrls: FormArray<FormControl<string | null>>;
}>;

export type ReportSubmissionPayload = {
  type: 'lost' | 'found';
  item_name: string;
  location: string;
  description: string;
};

export type FinalReportSubmission = {
  report_id?: number;
  type: 'lost' | 'found';
  status: 'pending';
  item_name: string;
  location: string;
  date_lost_found: string;
  date_reported: string;
  description: string;
  photoUrls: string[];
};

export type ReportSubmissionWithFiles = FinalReportSubmission & {
  files: File[];
};

export type FilePreview = {
  file: File;
  url: string;
  name: string;
};