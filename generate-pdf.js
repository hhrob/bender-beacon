const { mdToPdf } = require('md-to-pdf');
const path = require('path');

async function generatePDF() {
  try {
    const pdf = await mdToPdf(
      { path: 'BenderBeacon_Complete_Guide.md' },
      {
        dest: 'BenderBeacon_Complete_Guide.pdf',
        pdf_options: {
          format: 'A4',
          margin: '20mm',
          printBackground: true
        },
        launch_options: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      }
    );

    if (pdf) {
      console.log('PDF generated successfully: BenderBeacon_Complete_Guide.pdf');
    }
  } catch (error) {
    console.error('Error generating PDF:', error.message);
    process.exit(1);
  }
}

generatePDF();
