import { pool } from '../config/db.js';

/**
 * Migration Script: Inventory Movements Audit Ledger
 * Creates `inventory_movements` table if not exists and initializes movement records for existing inventory.
 */
export const migrateInventoryMovements = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_movements (
          id SERIAL PRIMARY KEY,
          product_id INT NULL,
          order_id INT NULL,
          change_quantity INTEGER NOT NULL,
          resulting_quantity INTEGER NOT NULL,
          movement_type VARCHAR(30) NOT NULL,
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT fk_inventory_movements_product FOREIGN KEY (product_id)
              REFERENCES products(id) ON DELETE SET NULL,
          CONSTRAINT fk_inventory_movements_order FOREIGN KEY (order_id)
              REFERENCES orders(id) ON DELETE SET NULL,
          CONSTRAINT chk_movement_type CHECK (
              movement_type IN ('INITIAL_STOCK', 'ORDER_RESERVATION', 'ORDER_CANCEL_RESTORE', 'ADMIN_ADJUSTMENT', 'RESTOCK')
          )
      );
    `);

    // 2. Create indexes if not exists
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_order_id ON inventory_movements(order_id);
      CREATE INDEX IF NOT EXISTS idx_inventory_movements_movement_type ON inventory_movements(movement_type);
    `);

    // 3. Populate initial movement records for inventory entries that have no audit history yet
    await client.query(`
      INSERT INTO inventory_movements (product_id, order_id, change_quantity, resulting_quantity, movement_type, notes)
      SELECT 
        i.product_id, 
        NULL AS order_id, 
        i.quantity AS change_quantity, 
        i.quantity AS resulting_quantity, 
        'INITIAL_STOCK' AS movement_type, 
        'Initial stock backfill migration' AS notes
      FROM inventory i
      LEFT JOIN inventory_movements im ON i.product_id = im.product_id
      WHERE im.id IS NULL AND i.quantity > 0;
    `);

    await client.query('COMMIT');
    console.log('✅ [MIGRATION] inventory_movements table and indexes applied successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ [MIGRATION FAILED] inventory_movements migration error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Execute if run directly from command line
if (process.argv[1] && process.argv[1].endsWith('migrate_inventory_movements.js')) {
  migrateInventoryMovements()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
