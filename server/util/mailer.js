const nodemailer = require('nodemailer');

// Create a transporter using the relay settings
const transporter = nodemailer.createTransport({
  host: 'smtpout.secureserver.net',  // SMTP server
  port: 587, // Use 465 for SSL if necessary
  secure: false,                           // No SSL/TLS
  auth: {
    user: 'andresfelipe@techrecruiterhub.com', // Your email for authentication
    pass: 'andres123456.'      // Your email password
  },
  debug: true, // Show debug output
  logger: true, // Log information to console
});

const sendMail = () => {
  const mailOptions = {
    from: 'andresfelipe@techrecruiterhub.com',         
    to: 'andres@techrecruiterhub.com',
    subject: 'We are running a test for the mailer',
    text: 'Each time a new candidate is entered into the system, an email is sent from andresfelipe@techrecruiterhub.com to andres@techrecruiterhub.com.'
  };

  return transporter.sendMail(mailOptions)
    .then((info) => {
      console.log('Email sent successfully!', info);
      return info;  // Return info for further use
    })
    .catch((error) => {
      console.error('Error sending email:', error.response ? error.response.data : error);
      throw error;  // Re-throw error for handling in the route
    });
};


module.exports = { sendMail };
