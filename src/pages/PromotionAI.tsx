import { useState } from "react";
import {
  Upload,
  Languages,
  Sparkles,
  Image,
  Copy,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2"; 
import { genAI } from "../config/model";

export default function PromotionAI() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [targetLang, setTargetLang] = useState("ID"); // ID, EN, JA
  const [loading, setLoading] = useState(false);

  const [aiResult, setAiResult] = useState<any>(null);

  const fileToGenerativePart = (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: (reader.result as string).split(",")[1],
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const executeVisionAI = async () => {
    if (!selectedFile) {
      return Swal.fire({
        icon: "warning",
        title: "Foto Belum Dipilih",
        text: "Silakan pilih atau unggah foto komoditas terlebih dahulu.",
      });
    }

    setLoading(true);
    try {
      const imagePart = await fileToGenerativePart(selectedFile);

      const prompt = ` Kamu adalah sistem AI Inspeksi Visual dan Marketing untuk UMKM Pertanian.
      Analisis gambar komoditas yang diunggah dan berikan respons dalam format JSON MURNI dengan struktur berikut:
      {
        "kategori": "Nama komoditas pertanian",
        "kualitas": "Grade A (Premium) / Grade B (Medium) / Grade C (Rendah) berdasarkan visual",
        "status": "Sangat Layak / Layak / Perlu Disortir",
        "copywriting_id": "Caption promosi WhatsApp/Medis sosial dalam Bahasa Indonesia kasual persuasif lengkap dengan hashtag",
        "copywriting_en": "Caption promosi dalam Professional Business English lengkap dengan hashtag",
        "copywriting_ja": "Caption promosi dalam bahasa Jepang profesional (Japanese) lengkap dengan hashtag"
      }
      
      ATURAN MUTLAK: Keluarkan HANYA objek JSON yang valid. Jangan berikan kata pengantar atau tanda petik markdown \`\`\`json.`;

      // Eksekusi pemanggilan menggunakan model tercepat dan efisien
      const response = await genAI.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [prompt, imagePart],
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      let data = "";
      for await (const chunk of response) {
        data += chunk.text;
      }
      const parsedData = JSON.parse(data);
      setAiResult(parsedData);

      Swal.fire({
        icon: "success",
        title: "Analisis Berhasil",
        text: "Kualitas produk berhasil dinilai dan teks promosi telah dibuat.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      Swal.fire({
        icon: "error",
        title: "Analisis Gagal",
        text: "Gagal memproses gambar. Pastikan konfigurasi benar atau silakan coba lagi nanti.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDisplayCopywriting = () => {
    if (!aiResult) return "";
    if (targetLang === "EN") return aiResult.copywriting_en;
    if (targetLang === "JA") return aiResult.copywriting_ja;
    return aiResult.copywriting_id;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getDisplayCopywriting());
    Swal.fire({
      icon: "success",
      title: "Teks Disalin",
      text: "Teks promosi pemasaran berhasil disalin ke papan klip.",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn p-4 md:p-0">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
          Mesin Visi Generatif
        </span>
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-800 mt-2 tracking-tight">
          AI Promotion Studio
        </h1>
        <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
          Inspeksi visual kualitas hasil panen sekaligus buat materi kampanye
          promosi otomatis dalam hitungan detik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 lg:col-span-5 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-slate-50 rounded-lg text-emerald-600">
              <Image size={18} />
            </div>
            <h2 className="font-bold text-base md:text-lg text-slate-800">
              Penilaian Kualitas Visual
            </h2>
          </div>

          {!imagePreview ? (
            <label className="border-2 border-dashed border-slate-200 rounded-2xl h-56 md:h-64 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-all duration-200 group p-4 text-center">
              <div className="p-3 md:p-4 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform duration-200 text-slate-400 group-hover:text-emerald-600">
                <Upload size={24} />
              </div>
              <p className="mt-4 text-xs font-bold text-slate-700">
                Tarik atau Pilih Foto Komoditas
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Mendukung format gambar JPEG dan PNG hingga 5MB
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="relative rounded-2xl overflow-hidden shadow-inner border h-56 md:h-64 bg-black flex items-center justify-center group">
              <img
                src={imagePreview}
                alt="Pratinjau produk"
                className="w-full h-full object-cover opacity-90"
              />
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreview(null);
                  setAiResult(null);
                }}
                className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow hover:bg-red-700 transition"
              >
                Ganti Foto
              </button>
            </div>
          )}

          <button
            onClick={executeVisionAI}
            disabled={loading || !selectedFile}
            className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4" />
                Mengevaluasi Kualitas & Menyusun Teks...
              </>
            ) : (
              "Jalankan Analisis AI"
            )}
          </button>
        </div>

        {/* RIGHT CARDS: AI Output Display */}
        <div className="space-y-6 lg:col-span-7 w-full">
          {aiResult ? (
            <>
              {/* AI Vision Analysis Results */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm">
                <div className="flex gap-2.5 items-center mb-4">
                  <div className="p-2 bg-slate-50 rounded-lg text-emerald-600">
                    <Sparkles size={18} />
                  </div>
                  <h2 className="font-bold text-base md:text-lg text-slate-800">
                    Hasil Analisis Mutu Aktual
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-center mt-5">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Kategori
                    </span>
                    <p className="text-sm font-bold text-slate-800 font-sans">
                      {aiResult.kategori}
                    </p>
                  </div>
                  <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Visual Grade
                    </span>
                    <p className="text-sm font-bold text-orange-700 font-sans">
                      {aiResult.kualitas}
                    </p>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Status Kelayakan
                    </span>
                    <p className="text-sm font-bold text-blue-700 font-sans">
                      {aiResult.status}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Copywriting Box */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 md:p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between border-b border-slate-50 pb-3">
                  <div className="flex gap-2.5 items-center">
                    <div className="p-2 bg-slate-50 rounded-lg text-emerald-600">
                      <Languages size={18} />
                    </div>
                    <h2 className="font-bold text-base md:text-lg text-slate-800">
                      Penulis Konten Multibahasa AI
                    </h2>
                  </div>

                  {/* Language Selector Tabs */}
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/40 self-start sm:self-auto">
                    {["ID", "EN", "JA"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setTargetLang(lang)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          targetLang === lang
                            ? "bg-white text-emerald-700 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {lang === "ID"
                          ? "Indonesia"
                          : lang === "EN"
                            ? "English"
                            : "日本語"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative group">
                  <textarea
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans leading-relaxed italic"
                    readOnly
                    value={getDisplayCopywriting()}
                  />
                  <button
                    onClick={handleCopyText}
                    className="w-full sm:w-auto sm:absolute sm:right-3 sm:bottom-4 mt-3 sm:mt-0 bg-white hover:bg-slate-50 text-slate-600 p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center gap-1.5 text-xs font-bold transition-all"
                  >
                    <Copy size={13} />
                    Salin Materi Promosi
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 md:p-12 text-center text-slate-400 flex flex-col items-center justify-center min-h-75 md:min-h-95 shadow-sm">
              <span className="text-4xl md:text-5xl mb-3">✨</span>
              <p className="text-sm font-semibold text-slate-700">
                Belum ada komoditas yang dievaluasi.
              </p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
                Silakan pilih atau ambil foto produk pertanian pada panel kiri
                untuk memulai prosedur penilaian otomatis dari Gemini Vision AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
