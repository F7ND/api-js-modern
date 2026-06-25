/* Brainly Search
   ygy
   by: FruatreMaou
   tags: Internet, Search, Scrape
*/

import { gotScraping } from 'got-scraping';

/**
 * Fungsi untuk mencari pertanyaan dan jawaban di Brainly menggunakan got-scraping
 * @param {string} query - Kata kunci pencarian
 * @param {number} limit - Jumlah maksimal hasil yang diambil
 */
async function searchBrainly(query, limit = 20) {
  const url = `https://brainly.com/bff/social-qa/answer-experience-web/api/v1/search?query=${encodeURIComponent(query)}&limit=${limit}&market=id`;

  try {
    // gotScraping otomatis memanipulasi HTTP/2 dan TLS Fingerprint agar lolos Cloudflare
    const response = await gotScraping({
      url: url,
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'origin': 'https://brainly.co.id',
        'referer': 'https://brainly.co.id/',
        'sec-ch-ua': '"Chromium";v="127", "Not)A;Brand";v="99", "Microsoft Edge Simulate";v="127"',
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"Android"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site'
      }
    });

    const data = JSON.parse(response.body);
    return parseBrainlyResponse(data);
  } catch (error) {
    console.error('Error fetching data dari Brainly:', error.message);
    throw error;
  }
}

/**
 * Fungsi internal untuk memformat dan membersihkan data JSON dari Brainly
 * @param {object} jsonResponse - Data mentah dari API
 */
function parseBrainlyResponse(jsonResponse) {
  if (!jsonResponse || !jsonResponse.success || !jsonResponse.data) {
    return [];
  }

  const results = jsonResponse.data.results || [];

  return results.map(item => {
    const q = item.question;
    const a = q?.answer;

    const cleanQuestion = q?.content ? q.content.replace(/<[^>]*>/g, '').trim() : '';
    const cleanAnswer = a?.content ? a.content.replace(/<[^>]*>/g, '').replace(/&lt;|&gt;/g, '').trim() : '';

    return {
      questionId: q?.id || null,
      question: cleanQuestion,
      subject: q?.subject?.name || null,
      grade: q?.grade?.name || null,
      answer: cleanAnswer,
      author: a?.author?.nick || null
    };
  });
}

// contoh penggunaan $ node brainly.js
try {
  const keyword = 'penemu lampu';
  console.log(`Sedang mencari informasi via got-scraping (ESM): "${keyword}"...\n`);
  
  const dataHasil = await searchBrainly(keyword, 5);
  
  console.log(`Berhasil mendapatkan ${dataHasil.length} data:\n`);
  console.log(JSON.stringify(dataHasil, null, 2));
} catch (err) {
  console.error('Proses pencarian gagal diselesaikan.');
}
