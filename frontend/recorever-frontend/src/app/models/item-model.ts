export type Report = {
  report_id: number;
  user_id: number;
  type: 'lost' | 'found';
  item_name: string;
  location: string;
  date_reported: string;
  date_resolved: string | null;
  description: string;
  status: 'pending' | 'approved' | 'matched' | 'claimed' | 'rejected';
  surrender_code: string | null;
  claim_code: string | null;
};

export type ReportFilters = {
  type: 'lost' | 'found';
  status?: 'pending' | 'approved' | 'matched' | 'claimed' | 'rejected';
  location?: string;
  item_name?: string;
};