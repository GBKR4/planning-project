import dotenv from 'dotenv';
import pool from './src/db/pool.js';

dotenv.config();

async function testBlockDeletion() {
  try {
    console.log('\n🔍 Testing block deletion after missed...\n');

    const userId = 1; // gbkr user
    const today = new Date().toISOString().split('T')[0];

    // Check current blocks
    const beforeBlocks = await pool.query(
      `SELECT pb.id, pb.status, pb.start_at, pb.end_at, t.title
       FROM plan_blocks pb
       LEFT JOIN tasks t ON pb.task_id = t.id
       JOIN plans p ON pb.plan_id = p.id
       WHERE p.user_id = $1 AND p.plan_date = $2
       ORDER BY pb.start_at`,
      [userId, today]
    );

    console.log('📋 Current blocks in today\'s plan:');
    console.log(`Total: ${beforeBlocks.rowCount} blocks\n`);
    
    beforeBlocks.rows.forEach((b, idx) => {
      const start = new Date(b.start_at).toLocaleTimeString();
      const end = new Date(b.end_at).toLocaleTimeString();
      console.log(`${idx + 1}. [${b.status}] ${b.title || '(no task)'}`);
      console.log(`   ID: ${b.id} | ${start} - ${end}\n`);
    });

    // Check scheduled blocks specifically
    const scheduledBlocks = beforeBlocks.rows.filter(b => b.status === 'scheduled');
    const missedBlocks = beforeBlocks.rows.filter(b => b.status === 'missed');
    const doneBlocks = beforeBlocks.rows.filter(b => b.status === 'done');

    console.log('📊 Breakdown:');
    console.log(`   Scheduled: ${scheduledBlocks.length}`);
    console.log(`   Missed: ${missedBlocks.length}`);
    console.log(`   Done: ${doneBlocks.length}`);
    console.log('');

    if (scheduledBlocks.length > 0) {
      console.log('💡 To test deletion:');
      console.log('   1. Mark a block as missed in the UI');
      console.log('   2. Check the backend logs for deletion messages');
      console.log('   3. Run this script again to verify blocks were removed');
      console.log('');
      console.log(`   Example: Mark block ${scheduledBlocks[0].id} as missed`);
    } else {
      console.log('⚠️  No scheduled blocks found. Run setup-realistic-schedule.js first');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testBlockDeletion();
