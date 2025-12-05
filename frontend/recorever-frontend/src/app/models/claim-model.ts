export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLAIMED = 'claimed'
}

export type Claim = {
  claim_id: number;
  report_id: number;
  user_id: number;
  user_name?: string;
  item_name?: string;
  status: ClaimStatus;
  admin_remarks?: string;
  claim_code?: string;
  created_at: string;
};