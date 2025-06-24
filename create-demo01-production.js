// Script to create demo01 account on production database
import fetch from 'node-fetch';

async function createDemo01Account() {
  try {
    // Using the correct Render.com URL for WhaleX Casino
    const response = await fetch('https://whalex-casino.onrender.com/api/create-demo01', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    console.log('✅ Demo01 account created/updated on production:');
    console.log(result);
  } catch (error) {
    console.error('❌ Error creating demo01 account:', error);
  }
}

createDemo01Account(); 