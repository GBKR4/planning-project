import pool from './src/db/pool.js';

async function checkCurrentBlocks() {
  try {
    // Get today's plan
    const plan = await pool.query(
      "SELECT * FROM plans WHERE user_id = $1 AND plan_date = $2",
      [1, '2026-03-04']
    );

    if (plan.rowCount === 0) {
      console.log('❌ No plan found for today');
      return;
    }

    console.log('\n📋 Current Plan ID:', plan.rows[0].id);

    // Get ALL blocks (no filter)
    const allBlocks = await pool.query(
      `SELECT pb.id, pb.status, pb.start_at, pb.end_at, t.title 
       FROM plan_blocks pb 
       LEFT JOIN tasks t ON pb.task_id = t.id 
       WHERE pb.plan_id = $1 
       ORDER BY pb.start_at`,
      [plan.rows[0].id]
    );

    console.log('\n🔍 ALL BLOCKS IN DATABASE:');
    console.log('Total:', allBlocks.rowCount);
    
    const now = new Date();
    allBlocks.rows.forEach(block => {
      const isPast = new Date(block.start_at) < now;
      const timeMark = isPast ? '⏳ PAST' : '⏰ FUTURE';
      console.log(`  ${timeMark} | ${block.status.toUpperCase()} | ${new Date(block.start_at).toLocaleTimeString()} | ${block.title || 'No title'}`);
    });

    // Show what getPlan SHOULD return
    const filteredBlocks = await pool.query(
      `SELECT pb.id, pb.status, pb.start_at, t.title 
       FROM plan_blocks pb 
       LEFT JOIN tasks t ON pb.task_id = t.id 
       WHERE pb.plan_id = $1 
         AND (
           (pb.status = 'scheduled' AND pb.start_at >= NOW())
           OR pb.status = 'done'
         )
       ORDER BY pb.start_at`,
      [plan.rows[0].id]
    );

    console.log('\n✅ BLOCKS RETURNED BY getPlan (with new filter):');
    console.log('Total:', filteredBlocks.rowCount);
    filteredBlocks.rows.forEach(block => {
      console.log(`  ${block.status.toUpperCase()} | ${new Date(block.start_at).toLocaleTimeString()} | ${block.title || 'No title'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCurrentBlocks();
