// api/brainly.js
module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  const query = (req.query.q || req.query.query || "").trim();
  const limit = Math.min(parseInt(req.query.limit || "5", 10) || 5, 20);

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Parameter q wajib diisi",
    });
  }

  const url = `https://brainly.com/bff/social-qa/answer-experience-web/api/v1/search?query=${encodeURIComponent(
    query
  )}&limit=${limit}&market=id`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "*/*",
        "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        origin: "https://brainly.co.id",
        referer: "https://brainly.co.id/",
        "user-agent":
          "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
      },
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: "Brainly request gagal",
        status: response.status,
        body: text.slice(0, 300),
      });
    }

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return res.status(500).json({
        success: false,
        message: "Response Brainly bukan JSON",
        raw: text.slice(0, 300),
      });
    }

    const results = parseBrainlyResponse(json);

    return res.status(200).json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Serverless function error",
      error: error.message,
    });
  }
};

function parseBrainlyResponse(jsonResponse) {
  const results = jsonResponse?.data?.results || [];

  return results.map((item) => {
    const q = item?.question || {};
    const a = q?.answer || {};

    const clean = (str) =>
      String(str || "")
        .replace(/<[^>]*>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim();

    return {
      questionId: q?.id || null,
      question: clean(q?.content),
      subject: q?.subject?.name || null,
      grade: q?.grade?.name || null,
      answer: clean(a?.content),
      author: a?.author?.nick || null,
    };
  });
}