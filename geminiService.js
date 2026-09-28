const { GoogleGenerativeAI } = require('@google/generative-ai');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
  });

  const maxRetries = 3;
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Gemini request attempt ${attempt}/${maxRetries}`);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Invalid Gemini response');
      }

      return text;
    } catch (error) {
      const message = error?.message || String(error);

      console.error(`Gemini API Error (attempt ${attempt}):`, message);

      const isTemporaryError =
        message.includes('503') ||
        message.includes('Service Unavailable') ||
        message.includes('UNAVAILABLE') ||
        message.includes('429') ||
        message.includes('Too Many Requests') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('504');

      if (!isTemporaryError || attempt === maxRetries) {
        throw error;
      }

      console.log(`Gemini temporarily unavailable. Retrying in ${delay / 1000}s...`);

      await sleep(delay);
      delay *= 2;
    }
  }
};

module.exports = {
  callGemini,
};