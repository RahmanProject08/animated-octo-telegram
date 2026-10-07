import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import webhookHandler from '../api/webhook.js';

// Baca file .env.local untuk environment testing lokal
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

async function runTests() {
  console.log('='.repeat(65));
  console.log(' PENGUJIAN 3 SKENARIO KEAMANAN WEBHOOK HMAC-SHA256');
  console.log('='.repeat(65));

  const secret = process.env.HMAC_SECRET;
  console.log(`HMAC_SECRET terdeteksi : ${secret ? 'AKTIF (via process.env)' : 'TIDAK ADA'}`);
  console.log(`Telegram Bot Token     : ${process.env.TELEGRAM_BOT_TOKEN ? 'TERSEDIA' : 'TIDAK TERSEDIA'}`);
  console.log(`Telegram Chat ID       : ${process.env.TELEGRAM_CHAT_ID ? process.env.TELEGRAM_CHAT_ID : 'TIDAK TERSEDIA'}`);
  console.log('-'.repeat(65));

  const payload = {
    status: 'BAHAYA',
    threat_level: 'CRITICAL',
    detail: 'Terdeteksi SQL Injection / Anomali pada tabel pengguna Supabase!'
  };
  const bodyString = JSON.stringify(payload);

  // Buat signature HMAC-SHA256 yang sah
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');

  let passedCount = 0;
  let failedCount = 0;

  // ----------------------------------------------------
  // TEST 1: Valid Signature (Harus 200 OK + Kirim Telegram)
  // ----------------------------------------------------
  console.log('\n[TEST 1] Skenario: Signature HMAC Valid');
  const req1 = {
    method: 'POST',
    headers: { 'x-signature': validSignature },
    body: payload
  };
  const res1 = createMockResponse();
  await webhookHandler(req1, res1);

  if (res1.statusCode === 200 && res1.body?.status === 'success') {
    console.log(` Status Code : ${res1.statusCode} OK`);
    console.log(` Telegram Sent: ${res1.body.telegram_alert_sent ? 'YA (Terkirim ke chat ID)' : 'TIDAK'}`);
    console.log(' Hasil        : PASSED ✅');
    passedCount++;
  } else {
    console.log(` Status Code : ${res1.statusCode}`);
    console.log(' Hasil        : FAILED ❌');
    failedCount++;
  }

  // ----------------------------------------------------
  // TEST 2: Tampered / Invalid Signature (Harus 401 Unauthorized)
  // ----------------------------------------------------
  console.log('\n[TEST 2] Skenario: Signature Diubah / Tampered');
  const tamperedSignature = 'deadbeef' + validSignature.substring(8);
  const req2 = {
    method: 'POST',
    headers: { 'x-signature': tamperedSignature },
    body: payload
  };
  const res2 = createMockResponse();
  await webhookHandler(req2, res2);

  if (res2.statusCode === 401 && res2.body?.status === 'error') {
    console.log(` Status Code : ${res2.statusCode} Unauthorized`);
    console.log(` Pesan Error : ${res2.body.message}`);
    console.log(' Hasil        : PASSED ✅');
    passedCount++;
  } else {
    console.log(` Status Code : ${res2.statusCode}`);
    console.log(' Hasil        : FAILED ❌');
    failedCount++;
  }

  // ----------------------------------------------------
  // TEST 3: Missing Header x-signature (Harus 400 Bad Request)
  // ----------------------------------------------------
  console.log('\n[TEST 3] Skenario: Tanpa Header x-signature');
  const req3 = {
    method: 'POST',
    headers: {},
    body: payload
  };
  const res3 = createMockResponse();
  await webhookHandler(req3, res3);

  if (res3.statusCode === 400 && res3.body?.status === 'error') {
    console.log(` Status Code : ${res3.statusCode} Bad Request`);
    console.log(` Pesan Error : ${res3.body.message}`);
    console.log(' Hasil        : PASSED ✅');
    passedCount++;
  } else {
    console.log(` Status Code : ${res3.statusCode}`);
    console.log(' Hasil        : FAILED ❌');
    failedCount++;
  }

  // ----------------------------------------------------
  // RINGKASAN
  // ----------------------------------------------------
  console.log('\n' + '='.repeat(65));
  console.log(`HASIL AKHIR: ${passedCount} passed, ${failedCount} failed`);
  if (failedCount === 0) {
    console.log('STATUS: SEMUA SKENARIO PENGUJIAN KEAMANAN LOLOS (100% SUKSES) ✅');
  } else {
    console.log('STATUS: ADA PENGUJIAN YANG GAGAL ❌');
  }
  console.log('='.repeat(65));
}

runTests().catch(console.error);
