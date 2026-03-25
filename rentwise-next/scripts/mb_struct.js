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
        console.log('Total parts (listings):', parts.length - 1);

        // Check listing i=1 (SECOND occurrence) to see what's in parts[1]
        // parts[1] = content FROM right after first "allImgPath" TO the start of second "allImgPath"
        if (parts.length > 2) {
            const between = parts[1]; // Between listing 1 and listing 2
            console.log('\nContent between listing 1 and 2 (first 500):');
            console.log(between.substring(0, 500));
            console.log('\nContent between listing 1 and 2 (chars 500-1000):');
            console.log(between.substring(500, 1000));
            console.log('\nContent between listing 1 and 2 (chars 1000-1500):');
            console.log(between.substring(1000, 1500));
            console.log('\nTotal size of between block:', between.length);

            // Check how many chars before price appears in parts[1]
            const priceIdx = between.indexOf('"price"');
            console.log('\n"price" first appears in between block at char:', priceIdx);
            if (priceIdx >= 0) {
                console.log('Price context:', between.substring(priceIdx, priceIdx + 50));
            }
        }

        done = true;
    });
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
