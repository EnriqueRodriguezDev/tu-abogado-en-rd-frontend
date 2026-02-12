
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:5173/booking'; // Adjust if needed
const SCREENSHOT_DIR = 'artifacts/screenshots';

if (!fs.existsSync(SCREENSHOT_DIR)){
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
    console.log('Starting Booking Flow Test...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport to Mobile to test responsive layout
    await page.setViewport({ width: 375, height: 812 });

    try {
        console.log(`Navigating to ${BASE_URL}...`);
        await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: `${SCREENSHOT_DIR}/step1_mobile.png` });
        console.log('Step 1 loaded.');

        // Step 1: Select first variant
        const variantSelector = '[data-testid="variant-btn"]';
        await page.waitForSelector(variantSelector);
        const variants = await page.$$(variantSelector);
        if (variants.length > 0) {
            await variants[0].click();
            console.log('Selected first service variant.');
        } else {
            throw new Error('No service variants found');
        }

        await new Promise(r => setTimeout(r, 500)); // Wait for selection state
        await page.screenshot({ path: `${SCREENSHOT_DIR}/step1_selected.png` });

        // Click Next
        const nextButtonSelector = '[data-testid="next-btn"]';
        // Check if next button is enabled/visible
        await page.click(nextButtonSelector);
        console.log('Clicked Next.');

        // Step 2: Date & Time
        await page.waitForSelector('[data-testid="date-btn"]', { visible: true });
        await new Promise(r => setTimeout(r, 1000)); // Animation wait
        await page.screenshot({ path: `${SCREENSHOT_DIR}/step2_mobile.png` });
        console.log('Step 2 loaded.');

        // Select a date
        const dates = await page.$$('[data-testid="date-btn"]');
        if (dates.length > 0) {
            await dates[0].click(); // Select first available date (often today)
            console.log('Selected date.');
        }

        // Wait for time slots
        await new Promise(r => setTimeout(r, 1000)); // Wait for fetch
        
        // Select time slot
        const timeSlotSelector = '[data-testid="time-slot-btn"]:not([disabled])';
        const slots = await page.$$(timeSlotSelector);
        if (slots.length > 0) {
            await slots[0].click();
            console.log(`Selected time slot.`);
        } else {
             console.log('No available time slots found for this date. Trying next date...');
             // Simple retry logic could go here, but for now we just log it.
        }

        await page.screenshot({ path: `${SCREENSHOT_DIR}/step2_selected.png` });

        // Click Next if slot selected
        if (slots.length > 0) {
            await page.click(nextButtonSelector);
            console.log('Clicked Next to Step 3.');
            
            await page.waitForSelector('input[placeholder="TU NOMBRE"]'); // or data-testid if added
            await page.screenshot({ path: `${SCREENSHOT_DIR}/step3_mobile.png` });
            console.log('Step 3 loaded.');
        }

        console.log('Test Complete (Partial Flow). Screenshots saved to artifacts/screenshots/');

    } catch (error) {
        console.error('Test Failed:', error);
        await page.screenshot({ path: `${SCREENSHOT_DIR}/error.png` });
    } finally {
        await browser.close();
    }
}

runTest();
