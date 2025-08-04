require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email sending endpoint
app.post('/send-report', async (req, res) => {
  try {
    const { email, screenshot, reportData } = req.body;

    if (!email || !screenshot || !reportData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate CSV content
    const headers = ['Ticket Number', 'Company', 'Contact', 'Email', 'Priority', 'Created', 'Status'];
    const rows = reportData.map(ticket => [
      ticket.ticketNumber || '',
      ticket.company || '',
      ticket.fullname || '',
      ticket.email || '',
      ticket.priority || '',
      ticket.timestamp ? new Date(ticket.timestamp).toLocaleDateString() : '',
      ticket.completedMonth ? 'Completed' : 'Open'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Ticket Report ${new Date().toLocaleDateString()}`,
      text: 'Please find attached the ticket report.',
      html: `
        <h1>Ticket Report</h1>
        <p>Total Tickets: ${reportData.length}</p>
        <p>Open Tickets: ${reportData.filter(t => !t.completedMonth).length}</p>
        <p>Completed Tickets: ${reportData.filter(t => t.completedMonth).length}</p>
        <p>See attached files for details.</p>
      `,
      attachments: [
        {
          filename: 'report.csv',
          content: csvContent
        },
        {
          filename: 'screenshot.png',
          content: screenshot.split('base64,')[1],
          encoding: 'base64'
        }
      ]
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: 'Report sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send report' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});