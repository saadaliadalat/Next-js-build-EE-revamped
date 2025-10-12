/*
  # EquityEdgeai Trading Platform Schema

  ## Overview
  Complete database schema for a full-stack trading platform with user management,
  trading functionality, deposits/withdrawals, and support ticketing system.

  ## New Tables

  ### 1. profiles
  Extends Supabase auth.users with additional user information
  - `id` (uuid, FK to auth.users) - User identifier
  - `full_name` (text) - User's full name
  - `is_admin` (boolean) - Admin flag for privileged access
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update

  ### 2. balances
  Tracks user account balances (allows negative for margin trading)
  - `id` (uuid) - Balance record identifier
  - `user_id` (uuid, FK) - Owner of the balance
  - `amount` (numeric) - Current balance (can be negative)
  - `currency` (text) - Currency code (USD, EUR, etc.)
  - `updated_at` (timestamptz) - Last balance update

  ### 3. trades
  Records all trading activity
  - `id` (uuid) - Trade identifier
  - `user_id` (uuid, FK) - Trader
  - `symbol` (text) - Trading pair (BTC/USD, etc.)
  - `type` (text) - Trade type (buy/sell)
  - `amount` (numeric) - Trade amount
  - `entry_price` (numeric) - Entry price
  - `exit_price` (numeric) - Exit price (null if open)
  - `profit_loss` (numeric) - P&L (null if open)
  - `status` (text) - Trade status (open/closed)
  - `opened_at` (timestamptz) - Trade open time
  - `closed_at` (timestamptz) - Trade close time

  ### 4. deposits
  Tracks deposit requests with proof uploads
  - `id` (uuid) - Deposit identifier
  - `user_id` (uuid, FK) - Depositor
  - `amount` (numeric) - Deposit amount
  - `currency` (text) - Currency
  - `proof_filename` (text) - Uploaded proof file
  - `status` (text) - Status (pending/approved/rejected)
  - `created_at` (timestamptz) - Request time
  - `verified_at` (timestamptz) - Verification time
  - `verified_by` (uuid, FK) - Admin who verified

  ### 5. withdrawals
  Tracks withdrawal requests
  - `id` (uuid) - Withdrawal identifier
  - `user_id` (uuid, FK) - Requester
  - `amount` (numeric) - Withdrawal amount
  - `currency` (text) - Currency
  - `bank_details` (jsonb) - Bank account information
  - `status` (text) - Status (pending/approved/rejected)
  - `created_at` (timestamptz) - Request time
  - `processed_at` (timestamptz) - Processing time
  - `processed_by` (uuid, FK) - Admin who processed

  ### 6. support_tickets
  Customer support ticketing system
  - `id` (uuid) - Ticket identifier
  - `user_id` (uuid, FK) - Ticket creator
  - `subject` (text) - Ticket subject
  - `message` (text) - Initial message
  - `status` (text) - Status (open/closed)
  - `priority` (text) - Priority level
  - `created_at` (timestamptz) - Creation time
  - `updated_at` (timestamptz) - Last update

  ### 7. ticket_replies
  Replies to support tickets
  - `id` (uuid) - Reply identifier
  - `ticket_id` (uuid, FK) - Parent ticket
  - `user_id` (uuid, FK) - Reply author
  - `message` (text) - Reply message
  - `is_admin` (boolean) - Admin reply flag
  - `created_at` (timestamptz) - Reply time

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Admin-only policies for verification/approval actions
  - Public read access for market data (future extension)
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create balances table
CREATE TABLE IF NOT EXISTS balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(20, 2) DEFAULT 0,
  currency text DEFAULT 'USD',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, currency)
);

ALTER TABLE balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own balance" ON balances;
CREATE POLICY "Users can view own balance"
  ON balances FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all balances" ON balances;
CREATE POLICY "Admins can view all balances"
  ON balances FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create trades table
CREATE TABLE IF NOT EXISTS trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  type text NOT NULL CHECK (type IN ('buy', 'sell')),
  amount numeric(20, 8) NOT NULL,
  entry_price numeric(20, 8) NOT NULL,
  exit_price numeric(20, 8),
  profit_loss numeric(20, 2),
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trades" ON trades;
CREATE POLICY "Users can view own trades"
  ON trades FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
CREATE POLICY "Users can insert own trades"
  ON trades FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trades" ON trades;
CREATE POLICY "Users can update own trades"
  ON trades FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all trades" ON trades;
CREATE POLICY "Admins can view all trades"
  ON trades FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(20, 2) NOT NULL,
  currency text DEFAULT 'USD',
  proof_filename text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id)
);

ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own deposits" ON deposits;
CREATE POLICY "Users can view own deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create deposits" ON deposits;
CREATE POLICY "Users can create deposits"
  ON deposits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all deposits" ON deposits;
CREATE POLICY "Admins can view all deposits"
  ON deposits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update deposits" ON deposits;
CREATE POLICY "Admins can update deposits"
  ON deposits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(20, 2) NOT NULL,
  currency text DEFAULT 'USD',
  bank_details jsonb NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id)
);

ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
CREATE POLICY "Users can view own withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create withdrawals" ON withdrawals;
CREATE POLICY "Users can create withdrawals"
  ON withdrawals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON withdrawals;
CREATE POLICY "Admins can view all withdrawals"
  ON withdrawals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update withdrawals" ON withdrawals;
CREATE POLICY "Admins can update withdrawals"
  ON withdrawals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create tickets" ON support_tickets;
CREATE POLICY "Users can create tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;
CREATE POLICY "Admins can update tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create ticket_replies table
CREATE TABLE IF NOT EXISTS ticket_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ticket_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view replies to own tickets" ON ticket_replies;
CREATE POLICY "Users can view replies to own tickets"
  ON ticket_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can reply to own tickets" ON ticket_replies;
CREATE POLICY "Users can reply to own tickets"
  ON ticket_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = ticket_replies.ticket_id
      AND support_tickets.user_id = auth.uid()
    )
    AND auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Admins can view all replies" ON ticket_replies;
CREATE POLICY "Admins can view all replies"
  ON ticket_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can create replies" ON ticket_replies;
CREATE POLICY "Admins can create replies"
  ON ticket_replies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
    AND auth.uid() = user_id
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_replies_ticket_id ON ticket_replies(ticket_id);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE OR REPLACE TRIGGER update_balances_updated_at
BEFORE UPDATE ON balances
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

CREATE OR REPLACE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- Function and trigger for new user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, is_admin, created_at, updated_at)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', false, now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();