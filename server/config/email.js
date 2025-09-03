const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
let transporter;

// Initialize email transporter
const initializeTransporter = () => {
  try {
    // Check if we have email credentials
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      console.log('Email transporter initialized');
    } else {
      console.log('Email credentials not configured, running in demo mode');
      
      // For development/testing - use ethereal.email
      nodemailer.createTestAccount().then(testAccount => {
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        console.log('Test email account created:', testAccount.user);
      }).catch(err => {
        console.error('Failed to create test email account:', err);
      });
    }
  } catch (error) {
    console.error('Error initializing email transporter:', error);
  }
};

// Send email
const sendEmail = async (options) => {
  try {
    if (!transporter) {
      console.log('Email transporter not initialized, initializing now...');
      initializeTransporter();
      
      // If still not initialized, return mock response
      if (!transporter) {
        console.log('Email would be sent (demo mode):', options);
        return {
          success: true,
          demo: true,
          messageId: `demo-${Date.now()}`
        };
      }
    }

    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Ubophone'}" <${process.env.EMAIL_FROM || 'noreply@ubophone.com'}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });

    console.log('Message sent: %s', info.messageId);
    
    // Preview URL for ethereal emails
    if (process.env.NODE_ENV !== 'production' && info.messageId) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Initialize on module load
initializeTransporter();

module.exports = {
  sendEmail
}; 