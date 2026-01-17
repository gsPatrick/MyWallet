const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://geral-mywallet-api.r954jc.easypanel.host/api/investments/assets';

// Options: type=FII (Real Estate Funds), limit=50
const PARAMS = '?type=FII&limit=50&page=1';

async function checkFIIs() {
    console.log(`Fetching FIIs from: ${API_URL}${PARAMS}`);

    try {
        const response = await axios.get(`${API_URL}${PARAMS}`, {
            headers: {
                // 'Authorization': 'Bearer YOUR_TOKEN_HERE' // Uncomment and paste token if 401
            }
        });

        console.log('Status:', response.status);
        console.log('Response Type:', typeof response.data);

        // Handle nested data if present
        let assets = [];
        if (Array.isArray(response.data)) {
            assets = response.data;
        } else if (response.data?.data?.assets) {
            assets = response.data.data.assets;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
            assets = response.data.data;
        } else if (response.data?.assets) {
            assets = response.data.assets;
        }

        console.log(`Found ${assets.length} assets.`);

        // Log first 3 items to see structure and prices
        if (assets.length > 0) {
            console.log('\nSample items:');
            assets.slice(0, 3).forEach(asset => {
                console.log(`- ${asset.ticker}: Price R$ ${asset.price} (Type: ${asset.type})`);
            });
        }

        // Save full response
        fs.writeFileSync(
            path.join(__dirname, 'response_fiis.txt'),
            JSON.stringify(response.data, null, 2)
        );
        console.log('\nFull response saved to scripts/response_fiis.txt');

    } catch (error) {
        console.error('Error fetching data:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
        console.log('\nNOTE: If you got a 401 Unauthorized, you need to add your Token in the script.');
    }
}

checkFIIs();
