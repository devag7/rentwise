/**
 * RentWise Cron Scheduler
 * 
 * Runs the property scraper at 6:00 AM and 6:00 PM IST daily.
 * Designed to run inside Docker alongside the Next.js server.
 */

import cron from 'node-cron';
import { runScraper } from './scraper.js';

console.log('[CRON] RentWise Cron Scheduler initialized');
console.log('[CRON] Scraper scheduled at 06:00 and 18:00 IST daily');
console.log('[CRON] Timezone: Asia/Kolkata');

// Schedule at 6:00 AM IST
cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Triggering 6:00 AM IST scrape...');
    try {
        await runScraper();
    } catch (err) {
        console.error('[CRON] Morning scrape failed:', err);
    }
}, {
    timezone: 'Asia/Kolkata'
});

// Schedule at 6:00 PM IST
cron.schedule('0 18 * * *', async () => {
    console.log('[CRON] Triggering 6:00 PM IST scrape...');
    try {
        await runScraper();
    } catch (err) {
        console.error('[CRON] Evening scrape failed:', err);
    }
}, {
    timezone: 'Asia/Kolkata'
});

// Also run immediately on startup to populate initial data
console.log('[CRON] Running initial scrape on startup...');
runScraper().catch(err => {
    console.error('[CRON] Initial scrape failed:', err);
});

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('[CRON] Received SIGTERM. Shutting down gracefully.');
    process.exit(0);
});
