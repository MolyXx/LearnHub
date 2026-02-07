"use client"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Edit2, Trash2, Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter, AlignRight, AlignJustify, FileText, Plus, X, ExternalLink, Undo2, Redo2, ListOrdered, Pencil, FileImage, FileCode, FileSpreadsheet, FileType, Eye, Play } from "lucide-react"
import Link from "next/link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import TipTapLink from "@tiptap/extension-link"
import ChatWidget from "@/components/ChatWidget"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import FileIcon from "@/components/FileIcon"

export default function SubMateriPage() {
    const { materiSlug, subSlug } = useParams()
    const { data: session } = useSession()
    const [materi, setMateri] = useState(null)
    const [submateri, setSubmateri] = useState([])
    const [judul, setJudul] = useState("")
    const [files, setFiles] = useState([])
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL
    const [_, forceUpdate] = useState(0);
    const [judulValue, setJudulValue] = useState("")

    // File Upload/Edit State
    const [isUploading, setIsUploading] = useState(false)
    const [newFile, setNewFile] = useState(null)
    const [newFileTitle, setNewFileTitle] = useState("")
    const [newFileDesc, setNewFileDesc] = useState("") // This will store HTML from editor
    const [isAddingFile, setIsAddingFile] = useState(false)
    const [editingFileId, setEditingFileId] = useState(null)
    
    // Video Player State
    const [selectedVideo, setSelectedVideo] = useState(null)

    const isVideoFile = (path) => {
        if (!path) return false;
        const cleanPath = path.split('?')[0];
        const ext = cleanPath.split('.').pop().toLowerCase();
        return ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
    }

    // Editor for File Description (New)
    const descEditor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                bulletList: {
                    HTMLAttributes: {
                        class: "list-disc ml-10",
                    },
                },
                orderedList: {
                    HTMLAttributes: {
                        class: "list-decimal ml-10",
                    },
                },
            }),
            Underline,
            TextAlign.configure({
                types: ["heading", "paragraph"],
                alignments: ["left", "center", "right", "justify"],
                defaultAlignment: "left",
            }),
            TipTapLink.configure({
                openOnClick: false,
            }),
        ],
        content: "",
        onUpdate: ({ editor }) => {
             setNewFileDesc(editor.getHTML())
        },
    });

    useEffect(() => {
        if (isAddingFile && descEditor) {
            // If adding new file (not editing), reset content
            if (!editingFileId) {
                descEditor.commands.setContent("")
                setNewFileDesc("")
            }
        }
    }, [isAddingFile, descEditor, editingFileId])


    const fetchData = async () => {
        try {
            const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/`)
            const data = await res.json()

            console.log("Materi data:", data)

            setMateri(data)
            setSubmateri(data.submateri || [])

            const sub = data.submateri.find((s) => s.slug === subSlug)
            setJudul(sub?.judul || "")
            // setIsi is removed
            setFiles(sub?.files || [])
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [materiSlug, subSlug])

    const openEditDialog = (file) => {
        setEditingFileId(file.id)
        setNewFileTitle(file.judul)
        setNewFileDesc(file.deskripsi || "")
        if (descEditor) {
            descEditor.commands.setContent(file.deskripsi || "")
        }
        setNewFile(null) // Reset file input, as user might not want to change the file
        setIsAddingFile(true)
    }

    const handleFileSave = async () => {
        if (!newFileTitle) {
            toast.error("Judul harus diisi!")
            return
        }

        if (!editingFileId && !newFile) {
             toast.error("File harus diupload!")
             return
        }

        setIsUploading(true)
        const sub = submateri.find((s) => s.slug === subSlug)

        if (!sub) {
            toast.error("Submateri tidak ditemukan")
            setIsUploading(false)
            return
        }

        const formData = new FormData()
        formData.append("submateri", sub.id)
        if (newFile) {
            formData.append("file", newFile)
        }
        formData.append("judul", newFileTitle)
        formData.append("deskripsi", newFileDesc) // Sending HTML content

        try {
            let url = `${baseApiUrl}/materi-file/`
            let method = "POST"

            if (editingFileId) {
                url = `${baseApiUrl}/materi-file/${editingFileId}/`
                method = "PUT"
            }

            const res = await fetch(url, {
                method: method,
                body: formData,
            })

            if (!res.ok) {
                const err = await res.text()
                throw new Error(err)
            }

            toast.success(editingFileId ? "File berhasil diupdate!" : "File berhasil diupload!")
            
            // Reset state
            setNewFile(null)
            setNewFileTitle("")
            setNewFileDesc("")
            setEditingFileId(null)
            if (descEditor) descEditor.commands.setContent("")
            
            setIsAddingFile(false)
            fetchData()
        } catch (err) {
            console.error("Save failed", err)
            toast.error(editingFileId ? "Gagal update file" : "Gagal upload file")
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileDelete = async (fileId) => {
        try {
            const res = await fetch(`${baseApiUrl}/materi-file/${fileId}/`, {
                method: "DELETE",
            })

            if (!res.ok) throw new Error("Gagal hapus file")

            toast.success("File berhasil dihapus")
            fetchData()
        } catch (err) {
            console.error("Delete failed", err)
            toast.error("Gagal menghapus file")
        }
    }

    useEffect(() => {
        if (judul) {
            setJudulValue(judul)
        }
    }, [judul])

    const isAdmin = session?.user?.role === "admin" || session?.user?.role === "guru"

    // Only updates title now, as main content is removed
    const handleSave = async () => {
        if (saving) return
        setSaving(true)

        const payload = {
            judul: judulValue,
            // isi: editor.getHTML(), // Removed
        }

        try {
            const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/${subSlug}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errorText = await res.text()
                console.error("Save failed", errorText)
                toast.error("Gagal memperbarui materi!")
                return
            }

            setEditMode(false)
            window.dispatchEvent(new Event("refresh-submateri"));
            toast.success("Materi berhasil diperbarui!")
        } catch (err) {
            console.error("Save failed", err)
            toast.error("Gagal memperbarui materi!")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (subSlug) => {
        const res = await fetch(
            `${baseApiUrl}/materi/${materiSlug}/${subSlug}/`,
            { method: "DELETE" }
        );

        if (res.status === 204) {
            toast.success("Materi berhasil dihapus!");
            fetchData();
            window.dispatchEvent(new Event("refresh-submateri"));
        } else {
            toast.error("Gagal menghapus materi!");
        }
    };

    // Helper to get file URL
    const getFileUrl = (path) => {
        if (!path) return "#";
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        return `${baseApiUrl}${path}`;
    };

    if (!materi) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="flex min-h-screen">
            <div className="flex-1 p-8 flex flex-col max-sm:p-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    {/* Judul */}
                    <div className="flex-1">
                        {editMode ? (
                            <input
                                type="text"
                                value={judulValue}
                                onChange={(e) => setJudulValue(e.target.value)}
                                className="text-4xl font-bold mb-2 w-full bg-transparent border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 leading-normal"
                                placeholder="Judul materi"
                            />
                        ) : (
                            <h1 className="text-4xl text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-normal font-bold">
                                {judulValue}
                            </h1>
                        )}
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        {isAdmin && (
                            <>
                                {!editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="p-3 bg-white border border-gray-200/50 text-gray-700 rounded-xl hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100 hover:text-blue-600 hover:border-blue-200 transition-all hover:shadow-lg hover:shadow-blue-500/20"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                )}

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button
                                            className="p-3 bg-white border border-gray-200/50 text-red-600 rounded-xl hover:bg-gradient-to-br hover:from-red-50 hover:to-red-100 hover:border-red-200 transition-all hover:shadow-lg hover:shadow-red-500/20"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Materi ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDelete(subSlug)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                    </div>
                </div>

                {/* File Cards Section - Single Column */}
                <div className="grid grid-cols-1 gap-6 mb-8">
                    {files.map((file) => (
                        <div key={file.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                            {/* Description at the top */}
                            {file.deskripsi && (
                                <div className="mb-6 prose prose-blue max-w-none">
                                    <div dangerouslySetInnerHTML={{ __html: file.deskripsi }} />
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="p-0">
                                        <FileIcon filename={file.file} className="w-12 h-12" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-lg">{file.judul}</h3>
                                            {isVideoFile(file.file) ? (
                                                <button
                                                    onClick={() => setSelectedVideo(file)}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 mt-1"
                                                >
                                                    Putar Video <Play size={14} />
                                                </button>
                                            ) : (
                                                <Link
                                                    href={`/materi/${materiSlug}/${subSlug}/file/${file.id}`}
                                                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5 mt-1"
                                                >
                                                    Lihat File <Eye size={14} />
                                                </Link>
                                            )}
                                    </div>
                                </div>
                                {isAdmin && editMode && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditDialog(file)}
                                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleFileDelete(file.id)}
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Add File Card (Admin Only) */}
                    {isAdmin && editMode && (
                        <Dialog open={isAddingFile} onOpenChange={(open) => {
                            setIsAddingFile(open)
                            if (!open) {
                                setEditingFileId(null)
                                setNewFileTitle("")
                                setNewFileDesc("")
                                setNewFile(null)
                                if (descEditor) descEditor.commands.setContent("")
                            }
                        }}>
                            <DialogTrigger asChild>
                                <button 
                                    onClick={() => {
                                        setEditingFileId(null)
                                        setNewFileTitle("")
                                        setNewFileDesc("")
                                        setNewFile(null)
                                        if (descEditor) descEditor.commands.setContent("")
                                    }}
                                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-gray-500 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all min-h-[150px] group"
                                >
                                    <div className="p-4 bg-gray-100 rounded-full group-hover:bg-blue-100 transition-colors">
                                        <Plus size={28} className="text-gray-600 group-hover:text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-lg">Tambah File Baru</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>{editingFileId ? "Edit File" : "Tambah File Baru"}</DialogTitle>
                                    <DialogDescription>
                                        {editingFileId ? "Edit detail file atau ganti file." : "Upload file materi dan tambahkan deskripsi lengkap."}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Judul File</label>
                                        <input
                                            type="text"
                                            value={newFileTitle}
                                            onChange={(e) => setNewFileTitle(e.target.value)}
                                            className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Contoh: Modul Pertemuan 1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">File</label>
                                        <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                            <input
                                                type="file"
                                                onChange={(e) => setNewFile(e.target.files[0])}
                                                // Removed specific accept attribute to allow all files as requested
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                            />
                                        </div>
                                        {editingFileId && (
                                            <p className="text-xs text-gray-500 mt-1">*Biarkan kosong jika tidak ingin mengganti file.</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Deskripsi (Rich Text)</label>
                                        <div className="border rounded-xl overflow-hidden shadow-sm">
                                            {descEditor && (
                                                <div className="bg-gray-50 border-b p-2 flex gap-1 flex-wrap">
                                                    <button onClick={() => descEditor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${descEditor.isActive("bold") ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><Bold size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${descEditor.isActive("italic") ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><Italic size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded ${descEditor.isActive("underline") ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><UnderlineIcon size={16} /></button>
                                                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                                    <button onClick={() => descEditor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${descEditor.isActive("bulletList") ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><List size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded ${descEditor.isActive("orderedList") ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><ListOrdered size={16} /></button>
                                                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                                    <button onClick={() => descEditor.chain().focus().setTextAlign("left").run()} className={`p-1.5 rounded ${descEditor.isActive({ textAlign: "left" }) ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><AlignLeft size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().setTextAlign("center").run()} className={`p-1.5 rounded ${descEditor.isActive({ textAlign: "center" }) ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><AlignCenter size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().setTextAlign("right").run()} className={`p-1.5 rounded ${descEditor.isActive({ textAlign: "right" }) ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><AlignRight size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().setTextAlign("justify").run()} className={`p-1.5 rounded ${descEditor.isActive({ textAlign: "justify" }) ? "bg-white shadow text-blue-600" : "hover:bg-gray-200 text-gray-600"}`}><AlignJustify size={16} /></button>
                                                    <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
                                                    <button onClick={() => descEditor.chain().focus().undo().run()} className="p-1.5 rounded hover:bg-gray-200 text-gray-600" disabled={!descEditor.can().undo()}><Undo2 size={16} /></button>
                                                    <button onClick={() => descEditor.chain().focus().redo().run()} className="p-1.5 rounded hover:bg-gray-200 text-gray-600" disabled={!descEditor.can().redo()}><Redo2 size={16} /></button>
                                                </div>
                                            )}
                                            <div className="max-h-[300px] overflow-y-auto">
                                                <EditorContent editor={descEditor} className="p-4 prose prose-sm max-w-none min-h-[150px] focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <button
                                        onClick={() => setIsAddingFile(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleFileSave}
                                        disabled={isUploading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isUploading ? "Menyimpan..." : (editingFileId ? "Simpan Perubahan" : "Upload File")}
                                    </button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {isAdmin && editMode && (
                    <div className="mt-4 space-x-3 fixed bottom-8 z-50">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105" disabled={saving}>
                                    {saving ? "Menyimpan..." : "Simpan Judul"}
                                </button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Simpan Judul?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Perubahan pada judul akan disimpan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => handleSave()}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Simpan
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <button 
                            onClick={() => setEditMode(false)} 
                            className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-full shadow-lg hover:bg-gray-50 transition-all hover:scale-105" 
                            disabled={saving}
                        >
                            Keluar Mode Edit
                        </button>
                    </div>
                )}
                <ChatWidget materiSlug={materi.slug} subSlug={subSlug} />

                {/* Video Player Modal */}
                <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                    <DialogContent className="max-w-4xl bg-black border-gray-800 p-0 overflow-hidden">
                        <DialogHeader className="p-4 absolute top-0 left-0 w-full z-10 bg-gradient-to-b from-black/80 to-transparent">
                            <DialogTitle className="text-white flex items-center justify-between">
                                <span className="truncate">{selectedVideo?.judul}</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video w-full bg-black flex items-center justify-center">
                            {selectedVideo && (
                                <video 
                                    controls 
                                    autoPlay 
                                    className="w-full h-full"
                                    src={getFileUrl(selectedVideo.file)}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </main>
    )
}