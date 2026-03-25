const axios = require('axios');
const cheerio = require('cheerio');

function decode(s) {
    return s
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

(async () => {
    const { data: html } = await axios.get(
        'https://www.magicbricks.com/property-for-rent/residential-real-estate?cityName=Bangalore&localityName=Koramangala',
        { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }, timeout: 20000 }
    );
    const $ = cheerio.load(html);

    let done = false;
    $('script').each((_, el) => {
        if (done) return;
        const t = $(el).html() || '';
        if (!t.includes('allImgPath')) return;

        const parts = t.split('"allImgPath"');

        // Test listing i=1 extraction exactly as scraper does
        const i = 1;
        const before = parts[i - 1].slice(-2000);
        const after = parts[i];
        const context = before + after.substring(0, 3000);

        console.log('Context size:', context.length);
        console.log('Price in context?', context.includes('"price"'));

        // Replicate exact regex
        const priceMatches = [...context.matchAll(/"price"\s*:\s*"?(\d+)/g)].map(m => parseInt(m[1]));
        console.log('Price matches:', priceMatches);
        const priceNum = priceMatches.find(p => p >= 3000 && p <= 500000) || 0;
        console.log('Price selected:', priceNum);

        // Test images
        const arrayMatch = after.match(/:\s*\[([^\]]*)\]/);
        const rawImgs = arrayMatch ? (arrayMatch[1].match(/"([^"]+)"/g)?.map(s => s.replace(/"/g, '')) || []) : [];
        const decoded = rawImgs.map(decode);
        const images = decoded.filter(u => u.startsWith('http'));
        console.log('\nImages found:', images.length);
        if (images[0]) console.log('First image:', images[0].substring(0, 80));

        // Test URL
        const propUrlMatch = context.match(/"url"\s*:\s*"([^"]*(?:for-rent|FOR-Rent|-BHK-)[^"]*)"/i);
        console.log('\nPropUrl match:', propUrlMatch ? propUrlMatch[1] : 'NONE');

        // Test size
        const carpetMatch = context.match(/"carpet"\s*:\s*(\d+)/g)?.pop();
        const builtupMatch = context.match(/"builtUpArea"\s*:\s*(\d+)/g)?.pop();
        console.log('\nCarpet:', carpetMatch, '| BuiltUp:', builtupMatch);

        done = true;
    });
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
