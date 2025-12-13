import { FormArray, FormControl, FormGroup } from '@angular/forms';

export type Report = {
  report_id: number;
  user_id: number;
  type: 'lost' | 'found';
  item_name: string;
  location: string;
  date_reported: string;
  date_resolved: string | null;
  description: string;
  status:
      | 'pending'
      | 'approved'
      | 'matched'
      | 'claimed'
      | 'closed'
      | 'rejected';
  surrender_code: string | null;
  claim_code: string | null;
  reporter_name?: string;
  remarks?: string;
};

export type ReportFilters = {
  type?: 'lost' | 'found';
  status?: 'pending' | 'approved' | 'matched' | 'claimed'
      | 'rejected' | 'closed';
  location?: string;
  item_name?: string;
  user_id?: number;
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
  date_reported: FormControl<string | null>;
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
  type: 'lost' | 'found';
  status: 'pending';
  item_name: string;
  location: string;
  date_reported: string;
  description: string;
  photoUrls: string[];
};