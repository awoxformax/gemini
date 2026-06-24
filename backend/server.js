require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.post("/analyze", async (req, res) => {
  try {
    const { image } = req.body;

    const promptText = `
Extract all items from this receipt image.

For each item return:
- code
- name
- original_price
- discounted_price

If no code exists, use "N/A".

If no discount exists:
discounted_price must equal original_price.

Also calculate:
- avg_original
- avg_discounted

Return ONLY raw JSON.

Example:

{
  "products": [
    {
      "code": "123",
      "name": "Milk",
      "original_price": 5,
      "discounted_price": 4
    }
  ],
  "avg_original": 5,
  "avg_discounted": 4
}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: promptText,
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image,
                },
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error(
      error.response?.data || error.message || error
    );

    res.status(500).json({
      error: "Server Error",
    });
  }
});

app.get("/", (req, res) => {
  res.send("Receipt API Running");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server Running On Port ${PORT}`);
});