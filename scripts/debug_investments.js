const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'https://geral-mywallet-api.r954jc.easypanel.host/api';
const EMAIL = 'patrick@gmail.com';
const PASSWORD = 'patrick123';

async function debugAPI() {
    try {
        console.log('1. Attempting login...');
        const authRes = await axios.post(`${API_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });

        const responseBody = authRes.data;
        console.log('Login Response keys:', Object.keys(responseBody));

        // Robust Token Extraction
        const token = responseBody.data?.accessToken || responseBody.accessToken || responseBody.token;
        if (!token) {
            console.error('FAILED TO GET TOKEN. Response dump:', JSON.stringify(responseBody, null, 2));
            return;
        }
        console.log('Token obtained.');

        // Robust Profile Extraction
        const userData = responseBody.user || responseBody.data?.user;
        const profiles = responseBody.profiles || responseBody.data?.profiles;

        let profileId = null;
        if (userData?.profileId) profileId = userData.profileId;
        if (profiles?.[0]?.id) profileId = profiles[0].id;
        console.log('Profile ID used:', profileId);

        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
                ...(profileId ? { 'x-profile-id': profileId } : {})
            }
        };

        const timestamp = Date.now(); // Cache Buster

        // 2. Fetch Portfolio
        console.log('\n2. Fetching /investments/portfolio...');
        try {
            const portfolioRes = await axios.get(`${API_URL}/investments/portfolio?_t=${timestamp}`, config);
            fs.writeFileSync(
                path.join(__dirname, 'response_portfolio.txt'),
                JSON.stringify(portfolioRes.data, null, 2)
            );
            console.log('Saved portfolio response.');
        } catch (err) {
            console.error('Portfolio fetch failed:', err.message);
        }

        // 3. Fetch Assets (FIIs specifically to check zero prices)
        console.log('\n3. Fetching /investments/assets (FIIs)...');
        try {
            const assetsRes = await axios.get(`${API_URL}/investments/assets?type=FII&limit=10&page=1&_t=${timestamp}`, config);
            fs.writeFileSync(
                path.join(__dirname, 'response_assets.txt'),
                JSON.stringify(assetsRes.data, null, 2)
            );

            // Log prices to console for immediate check
            const data = assetsRes.data;
            const assets = Array.isArray(data) ? data : (data.data?.assets || data.data || []);

            console.log('\n--- PRICE CHECK ---');
            if (assets.length === 0) console.log('No assets found in response.');
            assets.slice(0, 5).forEach(a => {
                console.log(`${a.ticker}: R$ ${a.price}`);
            });
            console.log('-------------------');

        } catch (err) {
            console.error('Assets fetch failed:', err.message);
        }

    } catch (error) {
        console.error('Fatal Error:', error.response?.data || error.message);
        console.log('\nTIP: If login failed, please edit this script with valid credentials.');
        console.log('File: scripts/debug_investments.js');
    }
}

debugAPI();
