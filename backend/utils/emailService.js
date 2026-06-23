const { EmailClient } = require('@azure/communication-email');

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress = process.env.AZURE_SENDER_ADDRESS;

const hasAzureConfig = connectionString && senderAddress;

let emailClient = null;

if (hasAzureConfig) {
  emailClient = new EmailClient(connectionString);
  console.log('✉️ Azure Communication Services Email client initialized successfully!');
} else {
  console.warn(
    '\n⚠️ [WARNING]: Azure Email settings are missing from backend/.env.\n' +
    'Please add AZURE_COMMUNICATION_CONNECTION_STRING and AZURE_SENDER_ADDRESS to send real emails.\n' +
    'Falling back to Console Logging / Simulated Welcome Emails.\n'
  );
}

/**
 * Sends a real welcome email with a temporary password to a collaborator.
 * Falls back gracefully to console printing if Azure Email is not configured.
 */
async function sendTemporaryPasswordEmail(to, name, tempPassword) {
  if (!hasAzureConfig || !emailClient) {
    console.log('\n==================================================');
    console.log(`✉️ [SIMULATED EMAIL SENT TO ${to}] (Azure Email not configured)`);
    console.log(`Subject: Welcome to TaskFlow! Your Temporary Password`);
    console.log(`Body: Hello ${name}, your account has been created.`);
    console.log(`Use this temporary password to log in: ${tempPassword}`);
    console.log('Please change your password immediately upon logging in.');
    console.log('==================================================\n');
    return { message: 'Email logged to console (Azure Email not configured)' };
  }

  const emailMessage = {
    senderAddress: senderAddress,
    content: {
      subject: 'Welcome to TaskFlow! Your Temporary Password',
      plainText: `Hello ${name},\n\nYour collaborator account has been created successfully.\n\nUse this temporary password to log in: ${tempPassword}\n\nPlease change your password immediately upon logging in.\n\nBest regards,\nThe TaskFlow Team`,
      html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1b5e55; font-size: 24px; margin: 0; font-weight: bold;">Welcome to TaskFlow!</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Collaborative Task Management System</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 24px;" />
        <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6;">Your team administrator has created a collaborator account for you on TaskFlow.</p>
        <p style="font-size: 16px; line-height: 1.6;">Please use the temporary password below to log in and set up your permanent password:</p>
        
        <div style="background-color: #ebf0f0; border: 1px dashed rgba(27, 94, 85, 0.3); border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 22px; font-weight: bold; color: #1b5e55; letter-spacing: 1.5px;">${tempPassword}</span>
        </div>
        
        <p style="font-size: 14px; line-height: 1.6; color: #ef4444; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; padding: 12px;">
          <strong>Security Notice:</strong> You will be prompted to reset this temporary password immediately upon your first login.
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">
          Best regards,<br />
          <strong>The TaskFlow Team</strong>
        </p>
      </div>
      `,
    },
    recipients: {
      to: [
        {
          address: to,
        },
      ],
    },
  };

  try {
    const poller = await emailClient.beginSend(emailMessage);
    const response = await poller.pollUntilDone();
    console.log(`🚀 Real email sent to ${to} (Message ID: ${response.id})`);
    return response;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw error;
  }
}

module.exports = {
  sendTemporaryPasswordEmail,
};
