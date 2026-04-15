/**
 * Notification Service (WhatsApp Simulation)
 */

export const sendWhatsAppNotification = async (phone, message) => {
  console.log(`[WhatsApp Simulation] To: ${phone} | Message: ${message}`);
  
  // In a real implementation using Meta API or Twilio:
  // const response = await fetch('YOUR_WHATSAPP_API_ENDPOINT', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer YOUR_TOKEN' },
  //   body: JSON.stringify({ to: phone, body: message })
  // });
  // return response.json();

  return { success: true, messageId: 'sim_' + Date.now() };
};

export const sendAgreementLink = async (phone, propertyTitle, token) => {
  const link = `${window.location.origin}/agreements/login?token=${token}`;
  const message = `Hello! Your agreement for "${propertyTitle}" is ready for review and signing. Access it here: ${link}`;
  return sendWhatsAppNotification(phone, message);
};

export const sendOTP = async (phone, otp) => {
  const message = `Your verification code for Property Express agreement is: ${otp}. Do not share this code with anyone.`;
  return sendWhatsAppNotification(phone, message);
};
