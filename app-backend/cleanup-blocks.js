import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function cleanupAndReset() {
  try {
    console.log('\n🧹 Cleaning up duplicate blocks and resetting schedule...\n');

    const userId = 1; // gbkr
    const today = new Date().toISOString().split('T')[0];

    // Get today's plan
    const planResult = await pool.query(
      'SELECT id FROM plans WHERE user_id = $1 AND plan_date = $2',
      [userId, today]
    );

    if (planResult.rows.length === 0) {
      console.log('❌ No plan found for today. Run setup-realistic-schedule.js first');
      return;
    }

    const planId = planResult.rows[0].id;

    // Delete ALL blocks from today's plan
    const deleteResult = await pool.query(
      'DELETE FROM plan_blocks WHERE plan_id = $1 RETURNING id',
      [planId]
    );

    console.log(`🗑️  Deleted ${deleteResult.rowCount} blocks from today's plan`);
    console.log('✅ Plan is now clean!');
    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Run: node setup-realistic-schedule.js');
    console.log('   2. Test marking a block as missed');
    console.log('   3. Run: node test-block-deletion.js to verify');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

cleanupAndReset();
