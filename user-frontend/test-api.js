import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function testHeroAPI() {
    try {
        const API_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';
        console.log('Fetching from:', `${API_URL}/hero`);
        const res = await axios.get(`${API_URL}/hero`);
        console.log('Status:', res.status);
        console.log('Slides Found:', res.data.slides?.length || 0);
        console.log('First Slide Data:', JSON.stringify(res.data.slides?.[0], null, 2));
    } catch (err) {
        console.error('API Test Failed:', err.message);
        if (err.response) console.error('Response Data:', err.response.data);
    }
}

testHeroAPI();
