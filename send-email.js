const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  try {
    const { to, subject, html, screenshot } = JSON.parse(event.body);
    
    // 1. Configure SendGrid transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
    
    // 2. Prepare attachments
    const attachments = [];
    if (screenshot) {
      attachments.push({
        filename: 'report.png',
        content: screenshot.split('base64,')[1],
        encoding: 'base64'
      });
    }
    
    // 3. Send email
    await transporter.sendMail({
      from: 'ticket-system@yourdomain.com',
      to,
      subject,
      html,
      attachments
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully' })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send email',
        message: error.message 
      })
    };
  }
};