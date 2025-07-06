const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variable
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error("GEMINI_API_KEY not found in .env file. Please set it.");
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

async function callGeminiWithRetry(prompt, imagePart, maxRetries = 5, initialDelayMs = 1000) {
  let currentDelay = initialDelayMs;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await geminiModel.generateContent([prompt, imagePart]);
      return result.response.text();
    } catch (error) {
      if (error.response && error.response.status === 503) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Failed to get response from Gemini after ${maxRetries} attempts.`);
}

const prompt = `Analyze this image. First, determine if it is an Egyptian driver's license.
If it is an Egyptian driver's license, extract the following fields.
If it is NOT an Egyptian driver's license, set "is_driver_license" to false and leave other fields as null.
Otherwise, set "is_driver_license" to true and extract the details.

Return your response strictly as a JSON object, and DO NOT include any Markdown formatting like triple backticks or 'json' keyword.
If a field is not present or clearly readable, return its value as 'N/A'.
Dates should be formatted as YYYY-MM-DD.

{
  "is_driver_license": true,
  "name_arabic": "Full name of the licensee in Arabic or null if not a DL",
  "name_english": "Full name of the licensee in English or null if not a DL",
  "nationality": "Nationality of the licensee or null if not a DL",
  "national_id_number": "The National ID or License Number (usually 14 digits for National ID) or null if not a DL",
  "date_of_issue": "The date the license was issued (YYYY-MM-DD) or null if not a DL",
  "date_of_expiry": "The date the license expires (YYYY-MM-DD) or null if not a DL",
  "license_type": "The type of driving license (e.g., 'رخصة قياده خاصه', 'Private Driving License') or null if not a DL",
  "issuing_authority": "The authority that issued the license (e.g., 'إدارة مرور القاهرة') or null if not a DL",
  "issuing_unit": "The specific traffic unit that issued the license (e.g., 'وحدة مرور شبرا') or null if not a DL",
  "profession": "The profession of the licensee or null if not a DL"
}
`;

async function verifyDriverLicense(imagePath, mimeType) {
  const buffer = fs.readFileSync(imagePath);
  const imagePart = bufferToGenerativePart(buffer, mimeType);
  const textResponse = await callGeminiWithRetry(prompt, imagePart);

  let cleanText = textResponse.trim();
  if (cleanText.startsWith('```json') && cleanText.endsWith('```')) {
    cleanText = cleanText.slice(7, -3).trim();
  } else if (cleanText.startsWith('```') && cleanText.endsWith('```')) {
    cleanText = cleanText.slice(3, -3).trim();
  }

  try {
    const parsed = JSON.parse(cleanText);

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error("Gemini did not return a valid JSON object.");
    }

    // Handle licenses expiring in less than a year
    if (
      parsed.is_driver_license === true &&
      parsed.date_of_expiry &&
      parsed.date_of_expiry !== 'N/A'
    ) {
      const expiryDate = new Date(parsed.date_of_expiry);
      const today = new Date();


      // If the license is already expired
      if (expiryDate < today) {
        return {
          is_driver_license: false,
          reason: "License has already expired",
          name_arabic: null,
          name_english: null,
          nationality: null,
          national_id_number: null,
          date_of_issue: null,
          date_of_expiry: null,
          license_type: null,
          issuing_authority: null,
          issuing_unit: null,
          profession: null
        };
      }
    }

    return parsed;

  } catch (err) {
    throw new Error("Gemini response could not be parsed as JSON.");
  }
}

module.exports = {
  verifyDriverLicense
};
