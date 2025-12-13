export type Claim = {
  claim_id: number;
  report_id: number;
  created_at: string; 
  claimant_name: string;
  contact_email?: string;
  contact_phone?: string;
  admin_remarks?: string;
};