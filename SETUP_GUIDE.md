# Panduan Setup Environment & Integrasi

Berikut panduan langkah demi langkah untuk mengisi variabel di [.env.local](file:///c:/Users/ASUS/Downloads/Bismillah%20coba%20coba/.env.local) serta menyiapkannya di Vercel dan GitHub.

---

### 1. Telegram Bot Token & Chat ID
1. **Mendapatkan Bot Token**:
   - Buka Telegram dan cari [@BotFather](https://t.me/BotFather).
   - Ketik `/newbot`, lalu ikuti instruksi (masukkan nama bot dan username berakhiran `bot`).
   - Salin **API Token** yang diberikan (format: `1234567890:ABCdefGhIJKlmNoPQRsTUVwxyZ_xxxx`).
   - Masukkan ke `TELEGRAM_BOT_TOKEN`.
2. **Mendapatkan Chat ID**:
   - Kirim pesan `/start` atau pesan apa saja ke bot baru Anda.
   - Buka bot pemeriksa ID seperti [@userinfobot](https://t.me/userinfobot) atau [@getidsbot](https://t.me/getidsbot).
   - Bot tersebut akan membalas dengan **Id** angka Anda (contoh: `123456789`).
   - Masukkan ke `TELEGRAM_CHAT_ID`.

---

### 2. Supabase Configuration
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat/pilih project Anda.
2. Masuk ke menu **Project Settings** (ikon gerigi) -> **API**.
3. Salin:
   - **Project URL** -> masukkan ke `SUPABASE_URL`
   - **anon / public key** -> masukkan ke `SUPABASE_ANON_KEY`
   - **service_role secret key** (klik *Reveal*) -> masukkan ke `SUPABASE_SERVICE_ROLE_KEY` *(hanya gunakan di backend/serverless)*.

---

### 3. Vercel Setup
1. Hubungkan repository GitHub ke [Vercel Dashboard](https://vercel.com/).
2. Masuk ke project di Vercel -> tab **Settings** -> **Environment Variables**.
3. Tambahkan semua variabel yang ada di [.env.example](file:///c:/Users/ASUS/Downloads/Bismillah%20coba%20coba/.env.example):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `NEXT_PUBLIC_APP_URL` (isi dengan URL deployment domain dari Vercel, misalnya `https://nama-project.vercel.app`)

---

### 4. GitHub Setup
- Pastikan [.gitignore](file:///c:/Users/ASUS/Downloads/Bismillah%20coba%20coba/.gitignore) sudah terpasang agar [.env.local](file:///c:/Users/ASUS/Downloads/Bismillah%20coba%20coba/.env.local) **tidak bocor** ke repository publik/privat.
- Jika menggunakan **GitHub Actions (CI/CD)**:
  - Buka repo di GitHub -> **Settings** -> **Secrets and variables** -> **Actions**.
  - Masukkan secrets yang relevan jika build/test workflow membutuhkan env variables tersebut.
