const axios = require('axios');
const FormData = require('form-data');

const uploadToTelegram = async (fileBuffer, fileName) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendDocument`;

  const form = new FormData();
  form.append('chat_id', chatId);
  form.append('document', fileBuffer, { filename: fileName });

  try {
    const response = await axios.post(url, form, {
      headers: { ...form.getHeaders() },
    });

    if (response.data.ok) {
      const fileId = response.data.result.document.file_id;
      
      // 🔥 NEW LOGIC: Direct File Path Retrieval
      // Hum direct file_id se link generate kar rahe hain jo browser support karega
      const fileInfo = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
      const filePath = fileInfo.data.result.file_path;

      return {
        // Yeh URL direct browser mein PDF ko trigger karega bina Telegram par redirect kiye
        secure_url: `https://api.telegram.org/file/bot${token}/${filePath}`,
        public_id: fileId
      };
    }
  } catch (error) {
    console.error("❌ [TELEGRAM ERROR]:", error.response?.data || error.message);
    throw new Error("Telegram Uplink Failed");
  }
};

module.exports = { uploadToTelegram };