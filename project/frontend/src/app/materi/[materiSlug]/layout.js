"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Layers, ArrowLeft, Menu, ChevronLeft, Plus } from "lucide-react"
import { toast, Toaster } from "sonner";

export default function MateriLayout({ children }) {
  const { materiSlug, subSlug } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [materi, setMateri] = useState(null)
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [judulBaru, setJudulBaru] = useState("")
  const [saving, setSaving] = useState(false)
  const params = useParams();
  const activeSubslug = subSlug;
  const [openSidebar, setOpenSidebar] = useState(false);
  const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL

  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "guru"

  const fetchMateri = async () => {
    try {
      const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/`);
      const data = await res.json();
      setMateri(data);
    } catch (err) {
      console.error("Gagal mengambil materi:", err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchMateri();
      setLoading(false);
    };
    load();
  }, [materiSlug]);


  useEffect(() => {
    const handleRefresh = () => {
      fetchMateri();
    };

    window.addEventListener("refresh-submateri", handleRefresh);

    return () => {
      window.removeEventListener("refresh-submateri", handleRefresh);
    };
  }, []);


  const handleTambahSubmateri = async () => {
    if (!judulBaru.trim()) {
      toast.error("Judul wajib diisi!")
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/sub/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ judul: judulBaru }),
      })

      if (!res.ok) {
        console.error(await res.text())
        toast.error("Gagal menambahkan materi!")
        return
      }

      const newSub = await res.json()

      // update state materi agar langsung muncul di sidebar
      setMateri((prev) => ({
        ...prev,
        submateri: [...prev.submateri, newSub]
      }))
      toast.success("Materi berhasil ditambahkan!")

      setJudulBaru("")
      setOpenModal(false)
    } catch (err) {
      console.error(err)
      alert("Kesalahan jaringan")
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!materi) return <div className="flex justify-center items-center h-screen">Materi tidak ditemukan</div>

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* MOBILE MENU BUTTON */}
      <button
        onClick={() => setOpenSidebar(true)}
        className="
          md:hidden fixed top-1/5 left-0 -translate-y-1/2 z-50
          w-9 h-12
          bg-gradient-to-br from-blue-600 to-indigo-600
          rounded-r-full shadow-lg shadow-blue-500/30
          flex items-center justify-center
        "
      >
        <Menu className="w-5 h-5 text-white" />
      </button>
      <aside className={`fixed md:static top-0 left-0 h-screen z-50 bg-white/80 backdrop-blur-lg border-r border-gray-200/50 flex flex-col shadow-xl w-72 transform transition-transform duration-300 
        ${openSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <button
          onClick={() => setOpenSidebar(false)}
          className={
            `md:hidden absolute top-1/2 -right-10 -translate-y-1/2 w-10 h-10 bg-white border border-gray-200/50 rounded-r-xl p-2.5 hover:bg-gradient-to-r hover:from-blue-600 hover:to-indigo-600 hover:text-white transition-all z-10 shadow-lg hover:shadow-blue-500/30
             ${openSidebar ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
            `}
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-indigo-600">
          <button
            onClick={() => router.push("/materi")}
            className="flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </button>
          <h2 className="text-xl text-white">{materi.judul}</h2>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Materi */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 px-2">
            <Layers className="w-4 h-4" />
            <span>Daftar Materi</span>
            {isAdmin && (
            <button
              onClick={() => setOpenModal(true)}
              className=" ml-auto text-blue-600 hover:text-blue-800 font-bold text-lg bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          </div>

          <ul className="space-y-2">
            {materi.submateri.map((sub, index) => {
              const isActive = activeSubslug === sub.slug;

              return (
                <li key={sub.id}>
                  <button
                    onClick={() => {
                      router.push(`/materi/${materiSlug}/${sub.slug}`);
                      setOpenSidebar(false);
                    }}
                    className={`
                      w-full text-left px-4 py-3 rounded-xl transition-all
                      ${isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                        : "text-gray-700 hover:bg-white hover:shadow-md"
                      }
                    `}
                  >
                    {/* Number Bubble */}
                    <div className="flex items-center gap-3">
                      <span
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-sm
                          ${isActive ? "bg-white/20" : "bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600"}
                        `}
                      >
                        {index + 1}
                      </span>

                      {/* Title */}
                      <span className="flex-1">{sub.judul}</span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>


      {openModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80 z-50">
            <h3 className="text-lg text-gray-900 font-semibold mb-3">Tambah Submateri</h3>
            
            <input
              type="text"
              className="text-gray-900 w-full border px-3 py-2 rounded mb-4"
              placeholder="Judul submateri..."
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenModal(false)}
                className="text-white px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>

              <button
                onClick={handleTambahSubmateri}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" richColors />


      {/* Konten utama */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">{children}</main>
    </div>
  )
}
