// types/admin.ts
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_approved: boolean;
  is_admin: boolean;
  balances?: { available_balance: number }[];
}

export interface KycSubmission {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  id_document_url: string;
  address_proof_url: string;
  selfie_url: string;
  rejection_reason?: string | null;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  rejection_reason?: string | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: string;
  status: 'pending' | 'approved' | 'rejected';
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_holder_name: string;
  account_number: string;
  swift_code?: string | null;
}