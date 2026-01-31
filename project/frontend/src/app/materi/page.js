"use client"
import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Edit2, Trash2, Plus, LogOut, BookOpen, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { toast, Toaster } from "sonner";

export default function MateriPage() {
  const { data: session, status } = useSession()
  const [materiList, setMateriList] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [openModal, setOpenModal] = useState(false)
  const [judulBaru, setJudulBaru] = useState("")
  const [deskripsiBaru, setDeskripsiBaru] = useState("")
  const [coverImage, setCoverImage] = useState(null)
  const [previewImage, setPreviewImage] = useState(null);
  const [editMode, setEditMode] = useState(false)
  const [editingSlug, setEditingSlug] = useState(null)
  const [saving, setSaving] = useState(false)
  const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL

  // URL gambar
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http") || path.startsWith("https")) {
      return path; 
    }
    if (path.startsWith("blob:")) {
        return path; 
    }
    return `${baseApiUrl}${path}`; 
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  // Ambil data materi
  useEffect(() => {
    if (status === "authenticated") {
      const fetchMateri = async () => {
        try {
          const res = await fetch(`${baseApiUrl}/materi/`)
          const data = await res.json()
          console.log("HASIL API MATERI:", data)
          setMateriList(data)
        } catch (error) {
          console.error("Gagal mengambil data materi:", error)
        } finally {
          setLoading(false)
        }
      }
      fetchMateri()
    }
  }, [status])

  const handleTambahMapel = async () => {
    if (!judulBaru.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("judul", judulBaru);
      formData.append("deskripsi", deskripsiBaru);
      if (coverImage) formData.append("cover_image", coverImage);

      const res = await fetch(`${baseApiUrl}/materi/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error(await res.text());
        toast.error("Gagal menambah mapel");
        return;
      }

      const newMapel = await res.json();
      console.log("RESPON POST:", newMapel);

      setMateriList((prev) => [...prev, newMapel]);
      toast.success("Mapel berhasil ditambahkan!");

      // Reset modal
      setJudulBaru("");
      setDeskripsiBaru("");
      setCoverImage(null);
      setOpenModal(false);

    } catch (err) {
      console.error(err);
      alert("Kesalahan jaringan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug) => {
    try {
      const res = await fetch(`${baseApiUrl}/materi/${slug}/edit/`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Mapel berhasil dihapus!");

        setMateriList((prev) => prev.filter((item) => item.slug !== slug));
      } else {
        toast.error("Gagal menghapus mapel.");
      }
    } catch (err) {
      console.error("Error deleting mapel:", err);
      toast.error("Terjadi kesalahan saat menghapus.");
    }
  };
  const openEditModal = (materi) => {
    setEditMode(true);
    setEditingSlug(materi.slug);
    setJudulBaru(materi.judul);
    setDeskripsiBaru(materi.deskripsi);
    setPreviewImage(materi.cover_image || null);
    setOpenModal(true);
  };

  const handleUpdateMapel = async () => {
    if (!judulBaru.trim()) {
      toast.error("Judul wajib diisi");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("judul", judulBaru);
      formData.append("deskripsi", deskripsiBaru);
      if (coverImage) formData.append("cover_image", coverImage);

      const res = await fetch(`${baseApiUrl}/materi/${editingSlug}/edit/`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        toast.error("Gagal memperbarui mapel");
        return;
      }

      const updated = await res.json();
      toast.success("Mapel berhasil diperbarui!");

      setMateriList(prev =>
        prev.map(item => item.slug === editingSlug ? updated : item)
      );

      setOpenModal(false);
      setEditMode(false);
      setEditingSlug(null);

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  const openTambahModal = () => {
    setEditMode(false);
    setJudulBaru("");
    setDeskripsiBaru("");
    setCoverImage(null);
    setPreviewImage(null);
    setOpenModal(true);
  };


  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null

  const isAdmin = session?.user?.role === "admin"

  return (
    
    <div className="min-h-screen bg-[#f4f7fc]">
      <Toaster position="top-right" richColors />

      {/* NAVBAR */}
      <nav className="w-full bg-white shadow-sm px-5 sm:px-10 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div>
            <img
              src="/favicon.ico"
              alt="Logo"
              className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
            />
          </div>

          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">LearnHub</h1>
            <p className="text-xs sm:text-sm text-gray-500 -mt-1">
              Website Pembelajaran Dengan Asisten AI
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {isAdmin && (
            <button
              onClick={openTambahModal}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-5 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105 text-sm sm:text-base active:scale-95"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Tambah
            </button>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-1.5 sm:gap-2 bg-white border border-gray-200 text-gray-700 px-3 sm:px-5 py-2 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all text-sm sm:text-base active:scale-95"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            Logout
          </button>
        </div>
      </nav>

      {/* CONTENT */}
      <main className="px-5 sm:px-10 py-6 sm:py-10">
        <h2 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
          Materi Pembelajaran
        </h2>
        <p className="text-gray-500 text-sm sm:text-base mb-6 sm:mb-10">
          Cari materi pembelajaran yang Anda butuhkan
        </p>

        {/* GRID */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
          {materiList.map((materi) => (
            <div
              key={materi.id}
              className="group bg-white rounded-2xl border border-gray-200/50 overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              {/* IMAGE */}
              <div className="relative overflow-hidden">
                {materi.cover_image ? (
                  <img
                    src={getImageUrl(materi.cover_image)}
                    className="w-full h-36 sm:h-52 object-cover transition-transform duration-500 group-hover:scale-110"
                    alt="Thumbnail"
                  />
                ) : (
                  <div className="w-full h-36 sm:h-52 bg-gray-300"></div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* CONTENT */}
              <div className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
                  {materi.judul}
                </h3>

                <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6 line-clamp-3">
                  {materi.deskripsi}
                </p>

                <div className="flex items-center justify-between">
                  <a
                    href={
                      materi.submateri?.length > 0
                        ? `/materi/${materi.slug}/${materi.submateri[0].slug}`
                        : `/materi/${materi.slug}/sub`
                    }
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:scale-105 text-sm sm:text-base active:scale-95"
                  >
                    Lihat
                  </a>

                  {isAdmin && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={() => openEditModal(materi)}
                        className="p-2 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 rounded-xl hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 transition-all hover:shadow-md active:scale-90"
                      >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-2 bg-gradient-to-br from-red-50 to-red-100 text-red-600 rounded-xl hover:from-red-100 hover:to-red-200 transition-all hover:shadow-md active:scale-90">
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </AlertDialogTrigger>

                        <AlertDialogContent className="w-[90%] max-w-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Mapel?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Mapel ini akan dihapus permanen dan tidak bisa dikembalikan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>

                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(materi.slug)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg w-full max-w-sm">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">
              {editMode ? "Edit Mapel" : "Tambah Mapel Baru"}
            </h3>

            <input
              type="text"
              className="w-full border px-3 py-2 rounded mb-3 text-gray-900 text-sm"
              placeholder="Judul mapel..."
              value={judulBaru}
              onChange={(e) => setJudulBaru(e.target.value)}
            />

            <textarea
              className="w-full border px-3 py-2 rounded mb-4 text-gray-900 text-sm"
              placeholder="Deskripsi mapel..."
              rows="3"
              value={deskripsiBaru}
              onChange={(e) => setDeskripsiBaru(e.target.value)}
            />

            {/* UPLOAD */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Cover Image</p>

              <label
                htmlFor="coverImage"
                className="cursor-pointer w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition"
              >
                {previewImage ? (
                  <img
                    src={
                      previewImage.startsWith("blob:")
                        ? previewImage
                        : getImageUrl(previewImage)
                    }
                    alt="Preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 h-32 justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mb-2 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v4a1 1 0 001 1h4m10-5h2a1 1 0 011 1v4m-6 5l-4-4-6 6m6-6l2 2 4-4"
                      />
                    </svg>
                    <p className="text-sm font-medium">Klik atau drag & drop</p>
                  </div>
                )}

                <input
                  type="file"
                  id="coverImage"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setCoverImage(file);
                    setPreviewImage(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
              </label>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setOpenModal(false)}
                className="px-3 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400"
              >
                Batal
              </button>

              <button
                onClick={editMode ? handleUpdateMapel : handleTambahMapel}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                {saving ? "Menyimpan..." : editMode ? "Simpan" : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}