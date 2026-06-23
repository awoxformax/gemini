require('dotenv').config(); 
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors'); 

const app = express();

app.use(cors()); 


app.use(express.json({ limit: '50mb' })); 


const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGODB_URI;
const geminiKey = process.env.GEMINI_API_KEY;

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB-yə uğurla qoşulduq! ✅"))
  .catch((err) => console.error("MongoDB xətası: ❌", err));


app.post('/api/gemini', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Şəkil datası göndərilməyib!" });
    }

    const googleUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    
    const promptText = `Extract all items from this receipt image. For each item, find its item code (if visible, otherwise "N/A"), product name, original price (before discount), and discounted price (after discount. If there is no discount, discounted_price must be equal to original_price). Also calculate the mathematical average of all original prices and all discounted prices for this receipt. Return ONLY a raw JSON object with this exact structure, no markdown code blocks, no text outside JSON:
    {
      "products": [
        { "code": "string", "name": "string", "original_price": number, "discounted_price": number }
      ],
      "avg_original": number,
      "avg_discounted": number
    }`;

    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

    const geminiResponse = await axios.post(googleUrl, {
      contents: [{
        parts: [
          { text: promptText },
          { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } }
        ]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    res.json(geminiResponse.data);

  } catch (error) {
    console.error("Server daxili xəta:", error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || "Server xətası baş verdi" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server ${PORT} portunda işləyir... 🚀`);
});