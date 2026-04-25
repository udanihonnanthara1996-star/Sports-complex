// Send a WhatsApp message using Twilio
const twilio = require('twilio');

const sendWhatsAppMessage = async (to, message) => {
  try {
    // Create a Twilio client using credentials from environment variables
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // Send the WhatsApp message
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',// Default Twilio WhatsApp sandbox number
      to: `whatsapp:${to}`// Recipient number in WhatsApp format
    });
    // Log the message SID after successful sending
    console.log('WhatsApp message sent:', result.sid);
    // Return the Twilio response
    return result;
  } catch (err) {
    // Log any error that occurs while sending the message
    console.error('WhatsApp send error:', err.message);
    // Re-throw the error so the caller can handle it
    throw err;
  }
};
// Export the helper function for use in other files
module.exports = { sendWhatsAppMessage };