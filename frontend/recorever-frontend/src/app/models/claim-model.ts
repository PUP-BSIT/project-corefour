export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CLAIMED = 'claim'
}

export type Claim = {
  claim_id: number;
  report_id: number;
  proof_description: string;
  item_name: string;
  status: ClaimStatus;
  created_at: string;
  claim_code?: string;
};