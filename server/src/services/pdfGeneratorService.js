import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateResumePDF = async (resumeData) => {
  try {
    // 1. Render the HTML using EJS template
    const templatePath = path.join(__dirname, '../templates/resumeTemplate.ejs');
    const htmlContent = await ejs.renderFile(templatePath, resumeData);

    // 2. Launch Puppeteer
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // 3. Set HTML and export
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ 
      format: 'A4', 
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw new Error('Could not generate PDF');
  }
};