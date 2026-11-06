export type MemberRole = 'contributor' | 'owner' | 'admin' | 'vendor' | 'student';
export type MemberStatus = 'active' | 'inactive' | 'suspended';
export type ProjectType = 'school' | 'wedding' | 'holiday' | 'savings' | 'custom';
export type ProjectStatus = 'active' | 'funded' | 'closed' | 'paused';
export type ProjectVisibility = 'private' | 'public';
export type PaymentPlatform = 'changoapp' | 'stripe' | 'gocardless' | 'paypal' | 'flutterwave' | 'square' | 'manual';
export type PaymentStatus = 'completed' | 'pending' | 'failed' | 'refunded';
export type ContributionFrequency = 'weekly' | 'monthly' | 'quarterly' | 'one-off';
export type RecognitionMethod = 'straight-line' | 'milestone' | 'percentage' | 'immediate';
export type POBType = 'custody' | 'milestone' | 'recurring' | 'immediate';
export type RevRecStatus = 'scheduled' | 'released' | 'reversed';
export type SyncStatus = 'running' | 'success' | 'partial' | 'failed';

export interface Individual {
  id: string;
  fundproj_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  role: MemberRole;
  status: MemberStatus;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  target_amount: number;
  currency: string;
  start_date: string;
  end_date?: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  owner_id?: string;
  contribution_link?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  individual_id: string;
  target_amount?: number;
  contribution_frequency: ContributionFrequency;
  enrolled_at: string;
  status: string;
}

export interface PaymentRecord {
  id: string;
  individual_id: string;
  project_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  platform: PaymentPlatform;
  platform_ref: string;
  status: PaymentStatus;
  sync_batch_id?: string;
  created_at: string;
}

export interface DeferredRevenue {
  id: string;
  project_id: string;
  individual_id: string;
  payment_id: string;
  deferred_amount: number;
  recognised_amount: number;
  remaining_amount: number;
  currency: string;
  recognition_method: RecognitionMethod;
  schedule_start: string;
  schedule_end?: string;
  pob_type?: POBType;
}

export interface RevRecScheduleEntry {
  id: string;
  deferred_id: string;
  project_id: string;
  individual_id: string;
  period_start: string;
  period_end: string;
  amount_to_recognise: number;
  amount_recognised: number;
  status: RevRecStatus;
  released_at?: string;
  journal_ref?: string;
}

export interface SyncLogEntry {
  id: string;
  platform: PaymentPlatform;
  sync_started_at: string;
  sync_ended_at?: string;
  status: SyncStatus;
  records_downloaded: number;
  records_inserted: number;
  records_skipped: number;
  records_unmatched: number;
  file_name?: string;
  error_message?: string;
  triggered_by: 'cron' | 'manual' | 'api';
}

export interface ProjectFundingSummary {
  project_id: string;
  total_raised: number;
  total_members: number;
  deferred_balance: number;
  recognised_revenue: number;
  last_payment_date?: string;
  last_sync_at?: string;
}

// Normalised payment from any platform
export interface NormalisedPayment {
  individual_id: string;
  project_id: string;
  amount: number;
  currency: string;
  payment_date: string;
  platform: PaymentPlatform;
  platform_ref: string;
  status: PaymentStatus;
  raw_payload?: Record<string, unknown>;
}

// CSV row from Changoapp SFTP
export interface ChangoappCSVRow {
  member_ref: string;
  project_code: string;
  amount: string;
  currency: string;
  payment_date: string;
  platform_ref: string;
  status: string;
  notes?: string;
}
