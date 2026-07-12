# AgroGenie.ai - Smart Agriculture Assistant 🧞‍♂️🌾

AgroGenie.ai adalah platform *dashboard* web berbasis kecerdasan buatan (AI) terintegrasi yang dirancang khusus untuk mempercepat digitalisasi operasional dan perluasan pasar UMKM Pertanian melalui pendekatan *zero-friction*. 

Aplikasi ini memecahkan kendala literasi digital operasional melalui pemanfaatan teknologi pengolahan suara natural sehingga petani dapat mencatat kas dan mengelola gudang logistik hanya dengan berbicara secara alami. Selain itu, platform ini mempercepat proses promosi komoditas melalui pemindaian visual hasil panen guna melakukan klasifikasi standar mutu barang sekaligus memproduksi konten *copywriting* pemasaran multibahasa (Indonesia, Inggris, Jepang) secara instan.

---

## 🚀 Fitur Utama

### 1. 📸 AI Visual Quality Grading & Multilingual Copywriter
* **Inspeksi Mutu Otomatis:** Memanfaatkan *Computer Vision* untuk memindai kondisi fisik komoditas langsung dari kamera perangkat atau unggahan galeri.
* **Klasifikasi Grade:** Mengklasifikasikan kategori produk ke dalam tingkatan grade kelayakan jual (Grade A/B/C) secara objektif.
* **Multilingual GenAI Content:** Memproduksi materi teks kampanye iklan promosi (*copywriting*) siap pakai dalam 3 bahasa (Indonesia, Inggris, dan Jepang) untuk melayani target pasar domestik maupun kebutuhan ekspor global.

### 2. 🎙️ AI Voice POS & Instant Inventory
* **Zero-Typing Ingestion:** Memungkinkan petani memperbarui data buku kas masuk/keluar serta stok gudang logistik hanya melalui perintah suara alami tanpa perlu mengetik manual.
* **Real-time Synchronization:** Data keuangan (*Point of Sales*) dan mutasi kuantitas stok di gudang logistik terperbarui secara atomik dan simultan via *cloud serverless*.
* **Data Isolation:** Implementasi gerbang autentikasi kaku guna memastikan integritas dan privasi isolasi data tersinkronisasi khusus per akun pengguna.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend Framework:** React 18 (TypeScript) + Vite
* **Styling Engine:** Tailwind CSS + Lucide Icons + SweetAlert2
* **Artificial Intelligence SDK:** `@google/genai` (Google Gemini 2.5 Flash Engine)
* **Backend & Cloud Database:** Firebase Services (Firestore & Firebase Authentication)
* **Voice Processing:** Web Speech API (`window.SpeechRecognition`)

