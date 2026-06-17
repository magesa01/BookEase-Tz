ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('mpesa', 'airtel_money', 'tigo_pesa', 'halopesa', 'card')),
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT DEFAULT ('BK-' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)));

CREATE UNIQUE INDEX IF NOT EXISTS bookings_transaction_id_idx
  ON bookings (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_receipt_number_idx
  ON bookings (receipt_number)
  WHERE receipt_number IS NOT NULL;
