import crypto from 'node:crypto';

export default async function handler(req, res) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'error',
      message: 'Method Not Allowed'
    });
  }

  // (a) Periksa apakah header x-signature ada. Jika tidak ada, tolak dengan 400 Bad Request.
  const signature = req.headers['x-signature'];
  if (!signature) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing x-signature header'
    });
  }

  // (b) Ambil isi body request sebagai string (JSON.stringify jika berupa objek)
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else if (req.body !== undefined && req.body !== null) {
    rawBody = JSON.stringify(req.body);
  } else {
    rawBody = '';
  }

  // (c) Buat HMAC-SHA256 dari body string
  const secret = process.env.HMAC_SECRET || '';
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // (d) Bandingkan HMAC yang dibuat dengan nilai di header x-signature (perbandingan string)
  if (calculatedHmac !== signature) {
    // (e) Jika tidak cocok, tolak dengan 401 Unauthorized
    return res.status(401).json({
      status: 'error',
      message: 'Invalid signature (Unauthorized)'
    });
  }

  // (e) Lanjutan: Jika cocok, lanjutkan ke pengiriman Telegram
  const payload = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const statusKejadian = payload.status || 'BAHAYA';
  const threatLevel = payload.threat_level || payload.level || 'CRITICAL';
  const detailPesan = payload.detail || payload.message || 'Terdeteksi insiden keamanan dari payload Supabase.';

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  let telegramSent = false;
  let telegramResponse = null;

  if (telegramToken && chatId) {
    const textMsg = `🚨 *SECURITY ALERT - SUPABASE WEBHOOK* 🚨\n\n` +
      `• *Status*: ${statusKejadian}\n` +
      `• *Level Ancaman*: ${threatLevel}\n` +
      `• *Detail*: ${detailPesan}\n` +
      `• *Timestamp*: ${new Date().toISOString()}`;

    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: textMsg,
          parse_mode: 'Markdown'
        })
      });
      telegramResponse = await tgRes.json();
      telegramSent = tgRes.ok;
    } catch (err) {
      console.error('Gagal mengirim ke Telegram:', err.message);
    }
  }

  return res.status(200).json({
    status: 'success',
    message: 'Webhook received and verified successfully',
    telegram_alert_sent: telegramSent,
    data: {
      status: statusKejadian,
      threat_level: threatLevel,
      detail: detailPesan
    }
  });
}
