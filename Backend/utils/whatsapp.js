const twilio = require('twilio');

const sendWhatsAppMessage = async (to, message) => {
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
      to: `whatsapp:${to}`
    });
    console.log('WhatsApp message sent:', result.sid);
    return result;
  } catch (err) {
    console.error('WhatsApp send error:', err.message);
    throw err;
  }
};

module.exports = { sendWhatsAppMessage };