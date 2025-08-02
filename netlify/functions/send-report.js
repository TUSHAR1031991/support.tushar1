const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    const { email, screenshot, ticketCount, date } = JSON.parse(event.body);
    
    // 1. Configure transporter (using Gmail example)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
    
    // 2. Process screenshot
    const imageBuffer = Buffer.from(screenshot.split('base64,')[1], 'base64');
    
    // 3. Send email
    await transporter.sendMail({
      from: 'your-ticket-system@yourdomain.com',
      to: email,
      subject: `Ticket Report ${date}`,
      html: `
        <h2>Ticket System Report</h2>
        <p>Total tickets: ${ticketCount}</p>
        <p>Generated on: ${date}</p>
        <p>See attached report screenshot</p>
      `,
      attachments: [{
        filename: 'report.png',
        content: imageBuffer
      }]
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
