import axios from 'axios';

async function testUpdateTask() {
  try {
    console.log('Testing task update with time_preference...\n');
    
    // First, login to get a token
    console.log('1️⃣ Logging in...');
    const loginRes = await axios.post('http://localhost:5000/auth/login', {
      email: 'test@example.com',
      password: 'test123'
    });
    
    const token = loginRes.data.accessToken;
    console.log('✅ Login successful, got token\n');
    
    // Get tasks to find one to update
    console.log('2️⃣ Getting tasks...');
    const tasksRes = await axios.get('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const firstTask = tasksRes.data[0];
    console.log(`✅ Found task: ID ${firstTask.id}, Title: "${firstTask.title}"\n`);
    
    // Update the task with time_preference
    console.log('3️⃣ Updating task with morning preference...');
    const updateRes = await axios.patch(
      `http://localhost:5000/api/tasks/${firstTask.id}`,
      {
        title: firstTask.title,
        time_preference: 'morning'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('✅ Update successful!');
    console.log('Updated task:', updateRes.data);
    console.log(`\ntime_preference is now: "${updateRes.data.time_preference}"`);
    
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testUpdateTask();
