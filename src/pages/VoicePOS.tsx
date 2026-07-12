import { useState, useEffect, useRef } from "react";
import {
  Mic,
  ShoppingCart,
  Boxes,
  Circle,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  LogOut,
} from "lucide-react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
  setDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import Swal from "sweetalert2";

// Import config
import { genAI } from "../config/model";
import { database, auth, googleProvider } from "../config/firebase";

export default function VoicePOS() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // State Fitur B POS
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [totalItemsInGudang, setTotalItemsInGudang] = useState(0);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const qTx = query(
      collection(database, "transaksi"),
      where("userId", "==", user.uid),
      orderBy("tanggal_transaksi", "desc"),
    );

    const unsubscribeTx = onSnapshot(
      qTx,
      (snapshot) => {
        const txList: any = [];
        let salesSum = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          txList.push({ id: doc.id, ...data });
          if (data.jenis_transaksi === "PEMASUKAN") {
            salesSum += data.total_harga || 0;
          }
        });
        setTransactions(txList);
        setTotalSales(salesSum);
      },
      (error) => {
        console.error("Firestore snapshot error:", error);
      },
    );

    const qGudang = query(
      collection(database, "gudang"),
      where("userId", "==", user.uid),
    );
    const unsubscribeGudang = onSnapshot(qGudang, (snapshot) => {
      setTotalItemsInGudang(snapshot.size);
    });

    return () => {
      unsubscribeTx();
      unsubscribeGudang();
    };
  }, [user]);

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      Swal.fire({
        icon: "success",
        title: "Autentikasi Berhasil",
        text: "Selamat datang di platform AgroGenie AI!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Login Error:", error);
      Swal.fire({
        icon: "error",
        title: "Autentikasi Gagal",
        text: "Gagal masuk menggunakan akun Google. Silakan coba kembali.",
      });
    }
  };

  const handleLogout = async () => {
    Swal.fire({
      title: "Apakah Anda yakin?",
      text: "Anda akan keluar dari sesi akun saat ini.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await signOut(auth);
        setTransactions([]);
        setTotalSales(0);
        setTotalItemsInGudang(0);
        Swal.fire({
          icon: "success",
          title: "Berhasil Keluar",
          text: "Sesi Anda telah diakhiri secara aman.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return Swal.fire({
        icon: "info",
        title: "Fitur Tidak Didukung",
        text: "Peramban (browser) Anda tidak mendukung fitur perekaman suara. Disarankan menggunakan Google Chrome.",
      });
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "id-ID";
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;

    recognitionRef.current.onresult = (e: any) =>
      setVoiceTranscript(e.results[0][0].transcript);
    recognitionRef.current.onend = () => setIsRecording(false);
    recognitionRef.current.start();
    setIsRecording(true);
  };

  const processVoiceTransaction = async () => {
    if (!voiceTranscript || !user) return;
    setLoading(true);

    try {
      const prompt = `
      Ekstrak data transaksi keuangan dan logistik pertanian dari teks suara berikut ke dalam format JSON MURNI: "${voiceTranscript}"
      Key JSON wajib: "jenis_transaksi" (PEMASUKAN/PENGELUARAN), "nama_barang", "kuantitas" (number), "satuan", "pihak_terkait", "total_harga" (number).
      ATURAN MUTLAK: Kembalikan HANYA string JSON murni tanpa markdown \`\`\`json.
      `;

      const response = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.1 },
      });

      const rawText = response.text || "";
      if (!rawText) throw new Error("Respons dari model AI kosong.");

      const {
        jenis_transaksi,
        nama_barang,
        kuantitas,
        satuan,
        pihak_terkait,
        total_harga,
      } = JSON.parse(rawText);

      const gudangRef = collection(database, "gudang");
      const q = query(
        gudangRef,
        where("nama_barang", "==", nama_barang),
        where("userId", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);

      let currentStok = 0;
      let docId = `${user.uid}-${nama_barang.toLowerCase().replace(/\s+/g, "-")}`;

      if (!querySnapshot.empty) {
        const barangDoc = querySnapshot.docs[0];
        docId = barangDoc.id;
        currentStok = barangDoc.data().stok || 0;
      }

      const qtyChange = Number(kuantitas);
      const newStok =
        jenis_transaksi === "PEMASUKAN"
          ? currentStok - qtyChange
          : currentStok + qtyChange;

      await setDoc(
        doc(database, "gudang", docId),
        {
          userId: user.uid,
          nama_barang,
          stok: newStok,
          satuan,
          last_updated: serverTimestamp(),
        },
        { merge: true },
      );

      await addDoc(collection(database, "transaksi"), {
        userId: user.uid,
        jenis_transaksi,
        nama_barang,
        kuantitas: qtyChange,
        satuan,
        total_harga: Number(total_harga),
        pihak_terkait,
        keterangan: `Voice Input: "${voiceTranscript}"`,
        tanggal_transaksi: serverTimestamp(),
      });

      setVoiceTranscript("");
      Swal.fire({
        icon: "success",
        title: "Transaksi Disimpan",
        text: "Data transaksi dan mutasi stok inventori berhasil direkam ke cloud database.",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Gagal Memproses",
        text: "Terjadi kesalahan saat mengekstraksi instruksi suara atau memperbarui database.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin h-6 w-6 text-emerald-600" />
        <p className="text-xs font-semibold">
          Mengamankan enkripsi sesi awan...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-100 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 text-3xl mx-auto shadow-inner">
          🎙️
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Kunci Akses Buku Kas AI
          </h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Untuk menguji fitur pencatatan logistik dan sinkronisasi data
            transaksi secara terisolasi, silakan masuk menggunakan akun Google
            Anda.
          </p>
        </div>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all duration-200 text-sm"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.94 1 12 1 7.24 1 3.2 3.74 1.25 7.76l3.87 3C6.06 7.42 8.78 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.43c-.28 1.44-1.1 2.66-2.33 3.47l3.6 2.8c2.1-1.94 3.3-4.8 3.3-8.37z"
            />
            <path
              fill="#FBBC05"
              d="M5.12 14.24c-.23-.69-.36-1.42-.36-2.24s.13-1.55.36-2.24L1.25 6.76C.45 8.34 0 10.1 0 12s.45 3.66 1.25 5.24l3.87-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.08 7.96-2.93l-3.6-2.8c-1.2.8-2.73 1.28-4.36 1.28-3.22 0-5.94-2.38-6.91-5.72l-3.87 3C3.2 20.26 7.24 23 12 23z"
            />
          </svg>
          Masuk Instan via Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
            Natural Language Processing
          </span>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-800 mt-2 tracking-tight">
            AI Voice POS & Inventory
          </h1>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-100 p-2 pr-4 rounded-2xl shadow-sm self-start">
          <img
            src={user.photoURL}
            alt="Avatar"
            className="w-8 h-8 rounded-xl shadow-inner"
          />
          <div className="text-left">
            <p className="text-xs font-black text-slate-800 max-w-30 truncate">
              {user.displayName}
            </p>
            <button
              onClick={handleLogout}
              className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-0.5 mt-0.5"
            >
              <LogOut size={10} /> Keluar Akun
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Voice Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-8 lg:col-span-7 shadow-sm flex flex-col items-center justify-center min-h-80">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <span className="absolute inline-flex h-28 w-28 rounded-full bg-red-400 opacity-20 animate-ping"></span>
            )}
            <button
              onClick={toggleRecording}
              disabled={loading}
              className={`relative w-28 h-28 rounded-full flex items-center justify-center hover:scale-105 transition-all duration-300 border-4 shadow-xl group disabled:bg-slate-300 ${
                isRecording
                  ? "bg-red-500 border-red-100 shadow-red-500/20"
                  : "bg-emerald-600 border-emerald-100 shadow-emerald-600/20"
              }`}
            >
              <Mic size={36} className="text-white" />
            </button>
          </div>

          <p className="text-center mt-6 text-xs font-bold text-slate-400 uppercase tracking-wide">
            {isRecording
              ? "Mendengarkan... Ketuk untuk Berhenti"
              : "Ketuk Mikrofon & Mulai Bicara"}
          </p>

          {voiceTranscript && (
            <div className="mt-8 w-full space-y-4">
              <div className="w-full rounded-2xl bg-slate-50 border border-slate-100 p-4 relative">
                <span className="absolute -top-2.5 left-4 px-2 bg-white text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border rounded">
                  Hasil Suara
                </span>
                <p className="text-sm font-semibold text-emerald-800 italic leading-relaxed pt-1">
                  "{voiceTranscript}"
                </p>
              </div>
              <button
                onClick={processVoiceTransaction}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-4 w-4" />
                ) : (
                  "Gunakan Data Ini & Simpan"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-5 w-full">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Omset Penjualan Anda
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-800 font-mono tracking-tight">
                Rp{totalSales.toLocaleString("id-ID")}
              </h2>
            </div>
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-inner">
              <ShoppingCart size={22} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Komoditas Gudang Anda
              </span>
              <h2 className="text-2xl lg:text-3xl font-black text-slate-800 font-mono tracking-tight">
                {totalItemsInGudang}{" "}
                <span className="text-sm font-medium text-slate-400 font-sans">
                  Item
                </span>
              </h2>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-inner">
              <Boxes size={22} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Buku Kas Pribadi Anda
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Menampilkan data aktual yang tersinkronisasi khusus dengan akun
              Anda
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                  <th className="p-4 pl-6">Komoditas</th>
                  <th className="p-4">Jenis Kas</th>
                  <th className="p-4">Mutasi Kuantitas</th>
                  <th className="p-4">Total Rupiah</th>
                  <th className="p-4">Mitra Dagang</th>
                  <th className="p-4 pr-6 text-center">Status DB</th>
                </tr>
              </thead>
              <tbody className="text-xs font-medium text-slate-600 divide-y divide-slate-50">
                {transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 pl-6 font-bold text-slate-800">
                      {tx.nama_barang}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          tx.jenis_transaksi === "PEMASUKAN"
                            ? "text-emerald-700 bg-emerald-50"
                            : "text-red-700 bg-red-50"
                        }`}
                      >
                        {tx.jenis_transaksi === "PEMASUKAN" ? (
                          <ArrowDownLeft size={12} />
                        ) : (
                          <ArrowUpRight size={12} />
                        )}
                        {tx.jenis_transaksi}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-mono font-semibold">
                      {tx.jenis_transaksi === "PEMASUKAN" ? "-" : "+"}{" "}
                      {tx.kuantitas} {tx.satuan}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-800">
                      Rp{tx.total_harga?.toLocaleString("id-ID")}
                    </td>
                    <td className="p-4 text-slate-500">{tx.pihak_terkait}</td>
                    <td className="p-4 pr-6 text-center">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase bg-emerald-50/40 border border-emerald-100/30 px-2 py-1 rounded-lg">
                        <Circle fill="currentColor" size={6} /> Synced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              Belum ada riwayat transaksi untuk akun ini. Silakan aktifkan
              mikrofon untuk mulai mencatat.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
