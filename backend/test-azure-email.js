const dotenv = require('dotenv');
dotenv.config();

const { EmailClient } = require('@azure/communication-email');

const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
const senderAddress = process.env.AZURE_SENDER_ADDRESS;

const hasAzureConfig = connectionString && senderAddress;

if (!hasAzureConfig) {
  console.error('❌ Error: AZURE_COMMUNICATION_CONNECTION_STRING or AZURE_SENDER_ADDRESS is missing in .env');
  console.log('Please define them inside backend/.env as follows:');
  console.log('AZURE_COMMUNICATION_CONNECTION_STRING="endpoint=https://<your-resource>.communication.azure.com/;accesskey=<your-key>"');
  console.log('AZURE_SENDER_ADDRESS="DoNotReply@<your-verified-domain>"');
  process.exit(1);
}

console.log('Azure ACS Email configuration found:');
console.log('- Connection String:', connectionString.substring(0, 45) + '...');
console.log('- Sender Address:', senderAddress);

const client = new EmailClient(connectionString);

async function testEmail() {
  console.log('Sending test email via Azure Communication Services...');
  
  const emailMessage = {
    senderAddress: senderAddress,
    content: {
      subject: 'Test Email - TaskFlow System',
      plainText: 'Hello! This is a test email sent from the TaskFlow system using Azure Communication Services.',
    },
    recipients: {
      to: [
        {
          address: senderAddress, // Send to yourself to test it
        },
      ],
    },
  };

  try {
    const poller = await client.beginSend(emailMessage);
    console.log('Email send started, waiting for completion...');
    const response = await poller.pollUntilDone();
    console.log('✅ Success! Test email sent successfully.');
    console.log('Message ID:', response.id);
    console.log('Status:', response.status);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sending test email:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testEmail();
