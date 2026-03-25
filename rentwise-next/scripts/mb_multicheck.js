const axios = require('axios');
const cheerio = require('cheerio');

function decode(s) {
    return s
        .replace(/\\\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
        .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

(async () => {
    const { data: html } = await axios.get(
        'https://www.magicbricks.com/property-for-rent/residential-real-estate?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,Studio-Apartment&cityName=Bangalore&localityName=Koramangala',
        { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }, timeout: 20000 }
    );
    const $ = cheerio.load(html);

    let done = false;
    $('script').each((_, el) => {
        if (done) return;
        const t = $(el).html() || '';
        if (!t.includes('allImgPath')) return;

        const parts = t.split('"allImgPath"');
        console.log('Total allImgPath blocks:', parts.length - 1);

        // Check multiple listings
        for (let i = 1; i <= Math.min(5, parts.length - 1); i++) {
            const before = parts[i - 1].slice(-2000);
            const after = parts[i];
            const context = before + after.substring(0, 12000);

            const priceMatches = [...context.matchAll(/"price"\s*:\s*"?(\d+)/g)].map(m => parseInt(m[1]));
            const priceNum = priceMatches.find(p => p >= 3000 && p <= 500000) || 0;
            const carpet = context.match(/"carpet"\s*:\s*(\d+)/g);
            const builtup = context.match(/"builtUpArea"\s*:\s*(\d+)/g);
            const superArea = context.match(/"superArea"\s*:\s*(\d+)/g);
            const plotArea = context.match(/"plotArea"\s*:\s*(\d+)/g);
            const sizeDisp = context.match(/"sizeDisp"\s*:\s*"([^"]+)"/);
            const bhkDesc = context.match(/"bhkDesc"\s*:\s*"([^"]+)"/);
            const propType = context.match(/"pType"\s*:\s*"([^"]+)"/);
            const images = (after.match(/\[([^\]]*)\]/)?.[1]?.match(/"([^"]+)"/g) || []).length;

            console.log(`\n=== Listing ${i} ===`);
            console.log('  price:', priceNum, '| images-count:', images);
            console.log('  carpet:', carpet?.slice(-2).join(', ') || 'NONE');
            console.log('  builtUpArea:', builtup?.slice(-2).join(', ') || 'NONE');
            console.log('  superArea:', superArea?.slice(-2).join(', ') || 'NONE');
            console.log('  sizeDisp:', sizeDisp?.[1] || 'NONE');
            console.log('  bhkDesc:', bhkDesc?.[1] || 'NONE');
            console.log('  pType:', propType?.[1] || 'NONE');
        }

        done = true;
    });
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
