// Utility untuk log virtual console
function addLog(message, type = 'info') {
  const consoleBox = document.getElementById('consoleBox');
  if (!consoleBox) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.innerHTML = `<span class="log-time">[${timeStr}]</span> ${escapeHtml(message)}`;

  consoleBox.appendChild(entry);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// [9.2] State Transition Metric Card
function setMetricState(state, infoText = '') {
  const card = document.getElementById('metricCard');
  const badge = document.getElementById('statusBadge');
  const headline = document.getElementById('statusHeadline');
  const desc = document.getElementById('statusDesc');
  const lastUpdated = document.getElementById('lastUpdated');

  if (!card) return;

  if (state === 'BAHAYA') {
    card.className = 'glass-card state-bahaya';
    badge.textContent = 'BAHAYA';
    headline.textContent = 'LEVEL ALERT: CRITICAL';
    desc.textContent = infoText || 'Peringatan keamanan aktif! Anomali atau serangan terdeteksi.';
    addLog(`[METRIC TRANSITION] State berubah: BAHAYA (CRITICAL ALERT)`, 'error');
  } else {
    card.className = 'glass-card state-aman';
    badge.textContent = 'AMAN';
    headline.textContent = 'SYSTEM SECURED';
    desc.textContent = infoText || 'Semua parameter operasional dalam batas toleransi aman.';
    addLog(`[METRIC TRANSITION] State berubah: AMAN (SYSTEM SECURED)`, 'success');
  }

  if (lastUpdated) {
    lastUpdated.textContent = new Date().toLocaleTimeString();
  }
}

// [9.3] Hitung HMAC-SHA256 Client-Side menggunakan Web Crypto API (window.crypto.subtle)
async function calculateHmacSha256(secretKey, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(message);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    msgData
  );

  // Ubah ArrayBuffer menjadi hex string
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const hexSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hexSignature;
}

// Handler Form Webhook
async function handleWebhookSubmit(e) {
  e.preventDefault();

  const statusVal = document.getElementById('webhookStatus').value;
  const threatLevel = document.getElementById('threatLevel').value;
  const messageVal = document.getElementById('webhookMessage').value;
  const secretKey = document.getElementById('hmacSecret').value;
  const isTampered = document.getElementById('tamperSignature').checked;
  const submitBtn = document.getElementById('btnSubmitWebhook');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Menghitung HMAC & Mengirim...';

  try {
    const payload = {
      status: statusVal,
      threat_level: `LEVEL_${threatLevel}`,
      detail: messageVal,
      timestamp: new Date().toISOString()
    };
    const bodyString = JSON.stringify(payload);

    addLog(`[WEBHOOK] Mempersiapkan payload: ${bodyString}`, 'info');

    // Hitung signature menggunakan Web Crypto API di browser
    let signature = await calculateHmacSha256(secretKey, bodyString);
    addLog(`[CLIENT HMAC] Signature dihitung: ${signature.substring(0, 16)}...`, 'info');

    if (isTampered) {
      signature = 'deadbeef' + signature.substring(8);
      addLog(`[ATTACK SIMULATION] Signature dipalsukan menjadi: ${signature.substring(0, 16)}...`, 'warn');
    }

    addLog(`[HTTP] Mengirim POST /api/webhook ...`, 'info');
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      },
      body: bodyString
    });

    const resData = await response.json().catch(() => ({}));

    if (response.status === 200) {
      addLog(`[WEBHOOK SUKSES] Status: 200 OK | Telegram Alert Sent: ${resData.telegram_alert_sent ? 'YA' : 'TIDAK'}`, 'success');
      // Update State Transition Metric Card
      setMetricState(statusVal, `Laporan webhook terverifikasi: ${messageVal}`);
    } else if (response.status === 401) {
      addLog(`[WEBHOOK DITOLAK] Status: 401 Unauthorized | ${resData.message || 'Signature tidak valid'}`, 'error');
    } else {
      addLog(`[WEBHOOK ERROR] Status: ${response.status} | ${resData.message || 'Gagal memproses request'}`, 'error');
    }

  } catch (err) {
    addLog(`[WEBHOOK EXCEPTION] Error: ${err.message}`, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Kirim Webhook ke /api/webhook';
  }
}

// [9.4] Handler Benchmark AI Asynchronous
async function handleBenchmarkAI() {
  const btn = document.getElementById('btnRunAI');
  const inputPrompt = document.getElementById('aiInputPrompt').value || 'Aktivitas terdeteksi bahaya';
  const execDuration = document.getElementById('aiExecDuration');
  const rfCard = document.getElementById('rfResultCard');
  const rfPred = document.getElementById('rfPrediction');
  const rfConf = document.getElementById('rfConfidence');
  const svmCard = document.getElementById('svmResultCard');
  const svmPred = document.getElementById('svmPrediction');
  const svmConf = document.getElementById('svmConfidence');

  btn.disabled = true;
  btn.textContent = 'Menjalankan asyncio.gather()...';

  addLog(`[AI BENCHMARK] Memanggil GET /api/proses_ai?input=${encodeURIComponent(inputPrompt)}`, 'info');
  const startTime = performance.now();

  try {
    const response = await fetch(`/api/proses_ai?input=${encodeURIComponent(inputPrompt)}`);
    const data = await response.json();
    const clientDuration = ((performance.now() - startTime) / 1000).toFixed(3);

    if (data.status === 'success' && data.results) {
      const serverDuration = data.duration_seconds;
      execDuration.textContent = `${serverDuration}s (Server async) / ${clientDuration}s (Client RTT)`;
      
      const rf = data.results.model_rf;
      const svm = data.results.model_svm;

      // Update RF Card
      rfPred.textContent = rf.prediction;
      rfConf.textContent = `Confidence: ${(rf.confidence * 100).toFixed(1)}%`;
      rfCard.className = `ai-card ${rf.prediction === 'BAHAYA' ? 'danger' : 'safe'}`;

      // Update SVM Card
      svmPred.textContent = svm.prediction;
      svmConf.textContent = `Confidence: ${(svm.confidence * 100).toFixed(1)}%`;
      svmCard.className = `ai-card ${svm.prediction === 'BAHAYA' ? 'danger' : 'safe'}`;

      addLog(`[AI RESPONSE] Total Waktu Eksekusi: ${serverDuration}s (Paralel ≤ 0.6s)`, 'success');
      addLog(`[AI RESULTS] RF: ${rf.prediction} (${(rf.confidence*100)}%) | SVM: ${svm.prediction} (${(svm.confidence*100)}%)`, 'info');
    } else {
      addLog(`[AI ERROR] Format respons tidak valid: ${JSON.stringify(data)}`, 'error');
    }
  } catch (err) {
    addLog(`[AI EXCEPTION] Gagal menghubungi endpoint: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Jalankan Rantai AI (Paralel)';
  }
}

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', () => {
  addLog('Dashboard Sistem Keamanan berhasil diinisialisasi.', 'info');
  addLog('Web Crypto API terdeteksi & siap untuk kalkulasi HMAC-SHA256.', 'info');

  const webhookForm = document.getElementById('webhookForm');
  if (webhookForm) {
    webhookForm.addEventListener('submit', handleWebhookSubmit);
  }

  const btnRunAI = document.getElementById('btnRunAI');
  if (btnRunAI) {
    btnRunAI.addEventListener('click', handleBenchmarkAI);
  }
});
