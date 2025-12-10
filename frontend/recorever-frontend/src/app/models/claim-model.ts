export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLAIMED = 'claim'
}

export type Claim = {
  claim_id: number;
  report_id: number;
  user_id: number;
  claim_code?: string;
  status: ClaimStatus;
  admin_remarks?: string;
  created_at: string;
  item_name?: string;
};