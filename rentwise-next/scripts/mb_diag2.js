const axios = require('axios');
const cheerio = require('cheerio');

function decodeUnicode(str) {
    return str
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

(async () => {
    const url = 'https://www.magicbricks.com/property-for-rent/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Bangalore&localityName=Koramangala';
    const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'Referer': 'https://www.magicbricks.com/' },
        timeout: 20000,
    });
    const $ = cheerio.load(html);
    
    let processed = 0;
    $('script').each((si, el) => {
        const scriptText = $(el).html() || '';
        if (!scriptText.includes('allImgPath')) return;
        
        const parts = scriptText.split('"allImgPath"');
        console.log('Script with allImgPath — parts count:', parts.length);
        
        // Try first listing block
        if (parts.length > 1) {
            const before = parts[0].slice(-2000);
            const after = parts[1];
            
            console.log('\n--- First listing block (last 300 chars of before):');
            console.log(before.slice(-300));
            
            console.log('\n--- First 200 chars of after (allImgPath array):');
            console.log(after.substring(0, 200));
            
            // Try parsing the array - raw
            const arrayMatch = after.match(/:\s*\[([^\]]*)\]/);
            if (arrayMatch) {
                const rawContent = arrayMatch[1].substring(0, 200);
                console.log('\nRaw array content (200):', rawContent);
                
                const rawImgs = arrayMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || [];
                console.log('Raw imgs before decode:', rawImgs.slice(0, 2));
                
                const decoded = rawImgs.map(s => decodeUnicode(s));
                console.log('Decoded imgs:', decoded.slice(0, 2));
                console.log('Decoded starts with http:', decoded[0]?.startsWith('http'));
            } else {
                console.log('No array match!');
                console.log('after start:', after.substring(0, 100));
            }
            
            // Check price extraction
            const priceMatches = before.match(/"price"\s*:\s*"?(\d+)/g);
            console.log('\nPrice matches in block:', priceMatches?.slice(-3));
        }
        processed++;
    });
    
    if (!processed) console.log('No scripts with allImgPath found!');
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
