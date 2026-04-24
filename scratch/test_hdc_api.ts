
async function test() {
    try {
        const url = 'https://opendata.moph.go.th/api/v1/report_data/s_telemed_hosp?areacode=65&b_year=2569';
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) {
            console.error('Fetch failed:', response.status);
            return;
        }
        const data = await response.json();
        console.log('Total items:', data.length);
        if (data.length > 0) {
            console.log('Sample item:', JSON.stringify(data[0], null, 2));
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

test();
