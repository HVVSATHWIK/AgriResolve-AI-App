import fetch from 'node-fetch';

const BASE_URL = process.env.API_URL || 'https://agriresolve-backend.onrender.com';

async function testHealth() {
    console.log(`Testing Health Check at ${BASE_URL}/api/health...`);
    try {
        const res = await fetch(`${BASE_URL}/api/health`);
        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Health Check Failed:', error.message);
    }
}

async function testAnalysis() {
    console.log(`\nTesting Analysis Endpoint at ${BASE_URL}/api/analysis...`);
    try {
        const res = await fetch(`${BASE_URL}/api/analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskType: 'VISION_FAST', // Use a valid task type
                prompt: 'Test prompt for connectivity check',
                // No image provided to test validation or specific error
            })
        });

        console.log('Status:', res.status);
        const data = await res.json();
        console.log('Response:', JSON.stringify(data, null, 2));

        if (res.status === 500) {
            console.error('❌ STILL FAILING WITH 500 ERROR');
        } else if (res.status === 400 && data.message.includes('image')) {
            console.log('✅ 500 Error Resolved! (Got expected 400 Validation Error)');
        } else if (res.status === 200) {
            console.log('✅ Success!');
        }
    } catch (error) {
        console.error('Analysis Request Failed:', error.message);
    }
}

async function run() {
    await testHealth();
    await testAnalysis();
}

run();
