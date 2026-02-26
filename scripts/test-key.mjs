import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_SERVICE_TOKEN;

console.log('=== API Key Verification ===');
console.log('GEMINI_API_KEY set:', !!process.env.GEMINI_API_KEY);
console.log('GEMINI_SERVICE_TOKEN set:', !!process.env.GEMINI_SERVICE_TOKEN);
console.log('Key prefix:', apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING');
console.log('Key length:', apiKey ? apiKey.length : 0);

if (!apiKey) {
    console.error('\n❌ No API key found! Set GEMINI_SERVICE_TOKEN or GEMINI_API_KEY in .env');
    process.exit(1);
}

console.log('\nTesting Gemini API with gemini-1.5-flash...');

try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [{ parts: [{ text: 'Say hello in 5 words' }] }],
        config: { maxOutputTokens: 20 }
    });

    console.log('✅ API Key works!');
    console.log('Response:', response.text);
} catch (error) {
    console.error('❌ API Key failed:', error.message);
    if (error.status) {
        console.error('Status code:', error.status);
    }
}
