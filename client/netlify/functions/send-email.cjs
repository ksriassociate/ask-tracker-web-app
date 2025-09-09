const Mailgun = require('mailgun.js');
const formData = require('form-data');

// Initialize the Mailgun client
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: process.env.MAILGUN_API_BASE_URL,
});

exports.handler = async (event) => {
  // Log the incoming request for debugging
  console.log("📩 Incoming request body:", event.body);

  try {
    const { customerEmail, natureOfWork } = JSON.parse(event.body);

    // Validate the customer email
    if (!customerEmail || typeof customerEmail !== 'string') {
      console.error("❌ Invalid or missing 'customerEmail' in request body");
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid 'customerEmail'" }),
      };
    }

    const domain = process.env.MAILGUN_DOMAIN;
    if (!domain) {
      console.error("❌ MAILGUN_DOMAIN is not set");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "MAILGUN_DOMAIN not set" }),
      };
    }

    const messageData = {
      // It's a good practice to use a verified sender email
      from: 'Truzly India - Team <verified-sender@your-domain.com>',
      // The 'to' field is correctly an array of strings
      to: [customerEmail],
      subject: `Great News! Your ${natureOfWork || 'work'} is completed!`,
      html: `
        Dear Valued Customer,
        <p>We're thrilled to announce that your ${natureOfWork || 'work'} has been successfully completed!</p>
        <p>Please let us know if you have any questions or require further assistance.</p>
        <p>Thank you,<br/>Truzly India - Team</p>
        <p>This is an auto-generated email.</p>
      `,
    };

    console.log("📤 Sending email to:", customerEmail);

    // Send the email
    const result = await mg.messages.create(domain, messageData);

    console.log("✅ Email sent:", result);
    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', message: 'Email sent successfully.' }),
    };

  } catch (error) {
    console.error("❌ Mailgun Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: error.message || 'Failed to send email.' }),
    };
  }
};