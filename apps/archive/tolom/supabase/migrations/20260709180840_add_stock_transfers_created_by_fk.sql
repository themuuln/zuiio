ALTER TABLE stock_transfers
ADD CONSTRAINT stock_transfers_created_by_fkey
FOREIGN KEY (created_by) REFERENCES profiles(id)
ON DELETE RESTRICT;