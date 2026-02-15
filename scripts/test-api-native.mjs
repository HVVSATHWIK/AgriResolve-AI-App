import https from 'https';

const BASE_URL = 'https://agriresolve-backend.onrender.com';

function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const reqOptions = {
            method: options.method || 'GET',
            headers: options.headers || {},
        };

        const req = https.request(url, reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (e) => reject(e));

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function run() {
    console.log('--- Testing API Health ---');
    try {
        const health = await makeRequest('/api/health');
        console.log(`Status: ${health.status}`);
        console.log(`Body: ${health.body}`);
    } catch (e) {
        console.error('Health check failed:', e.message);
    }

    console.log('\n--- Testing Analysis Endpoint (Mock Request) ---');
    try {
        const analysis = await makeRequest('/api/analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskType: 'VISION_FAST',
                prompt: 'Hello world'
            })
        });
        console.log(`Status: ${analysis.status}`);
        console.log(`Body: ${analysis.body}`);
    } catch (e) {
        console.error('Analysis request failed:', e.message);
    }
}

run();
