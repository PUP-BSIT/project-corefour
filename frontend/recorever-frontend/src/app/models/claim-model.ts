export type Claim = {
  claim_id: number;
  report_id: number;
  claimant_name: string;
  contact_email: string;
  contact_phone: string;
  admin_remarks: string;
  created_at: string;

  status?: string; 
  claim_code?: string;
  user_id?: number;

  report?: {
    report_id: number;
    item_name: string;
    type: string;
    status: string;
  };
};