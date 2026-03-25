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
        const before = parts[0].slice(-3000);
        const after = (parts[1] || '').substring(0, 4000);
        const combined = before + after;

        // Search for ALL number-valued fields that could be rent
        const numFields = combined.match(/"(\w+)"\s*:\s*"?(\d{4,7})"?/g) || [];
        const rentCandidates = numFields.filter(f => {
            const n = parseInt(f.match(/(\d{4,7})/)[1]);
            return n >= 3000 && n <= 500000;
        });
        console.log('Fields with values in rent range (3000-500000):', rentCandidates.slice(0, 10));

        // Show sipro context (3 lines around it to see neighboring fields)
        const siproIdx = combined.indexOf('"sipro"');
        if (siproIdx >= 0) {
            console.log('\nContext around sipro (1500 chars):');
            console.log(combined.substring(Math.max(0, siproIdx - 200), siproIdx + 1500));
        }

        done = true;
    });

    if (!done) console.log('No allImgPath scripts found');
    process.exit(0);
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
