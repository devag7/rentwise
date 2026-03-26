/**
 * RentWise Cron Scheduler
 * 
 * Runs the property scraper at 6:00 AM and 6:00 PM IST daily.
 * Designed to run inside Docker alongside the Next.js server.
 * 
 * NOTE: Does NOT run scraper on startup to prevent data purge during deploy.
 * To populate initial data, run: npx tsx scripts/scraper.ts
 */

import cron from 'node-cron';
import { runScraper } from './scraper.js';

console.log('[CRON] RentWise Cron Scheduler initialized');
console.log('[CRON] Scraper scheduled at 06:00 and 18:00 IST daily');
console.log('[CRON] Timezone: Asia/Kolkata');
console.log('[CRON] Next scrape will run at the scheduled time (no startup scrape)');

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

// Keep the process alive
process.on('SIGTERM', () => {
    console.log('[CRON] Received SIGTERM. Shutting down gracefully.');
    process.exit(0);
});

