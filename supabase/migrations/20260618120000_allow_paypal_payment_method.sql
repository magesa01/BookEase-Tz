ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_method_check
  CHECK (payment_method IN ('mpesa', 'airtel_money', 'tigo_pesa', 'halopesa', 'card', 'paypal'));
