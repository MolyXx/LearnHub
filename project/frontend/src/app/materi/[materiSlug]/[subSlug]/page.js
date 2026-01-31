"use client"
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Edit2, Trash2, Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Heading1, Heading2, Image, History, Undo2, Redo2, Minus, Unlink, Volume2, VolumeOff, ListOrdered, AlignJustify } from "lucide-react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import ImageExtension from "@tiptap/extension-image"
import { ResizableImage } from "tiptap-extension-resizable-image";
import ChatWidget from "@/components/ChatWidget"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { toast } from "sonner"

export default function SubMateriPage() {
    const { materiSlug, subSlug } = useParams()
    const { data: session } = useSession()
    const [materi, setMateri] = useState(null)
    const [submateri, setSubmateri] = useState([])
    const [isi, setIsi] = useState(null)
    const [judul, setJudul] = useState("")
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isSpeaking, setIsSpeaking] = useState(false);
    const isSettingContentRef = useRef(false)
    const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL
    const [_, forceUpdate] = useState(0);
    const [judulValue, setJudulValue] = useState("")

    const editor = useEditor({
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
            Link.configure({
                openOnClick: false,
            }),
            ImageExtension.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: "rounded-lg mx-auto",
                },
            }),
            ResizableImage.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: "rounded-lg mx-auto block max-w-full",
                },
            }),
        ],
        editable: editMode,
    });

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

    const processContentImages = (htmlContent) => {
        if (!htmlContent) return "";
        const baseUrl = baseApiUrl || ""; 
        
        return htmlContent.replace(/src="([^"]+)"/g, (match, src) => {
            if (src.startsWith("http") || src.startsWith("blob:")) {
                return match; 
            }
            const cleanSrc = src.startsWith("/") ? src : `/${src}`;
            return `src="${baseUrl}${cleanSrc}"`;
        });
    };

    useEffect(() => {
        if (!editor || !isi) return
        
        const processedContent = processContentImages(isi);

        setTimeout(() => {
            try {
                editor.commands.setContent(processedContent)
            } catch (e) {
                console.error("Gagal setContent:", e)
            }
        }, 0)
    }, [editor, isi])


    useEffect(() => {
        return () => {
            if (editor) editor.destroy()
        }
    }, [editor])

    useEffect(() => {
        if (editor) editor.setEditable(editMode)
    }, [editMode, editor])

    const fetchData = async () => {
        try {
            const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/`)
            const data = await res.json()

            console.log("Materi data:", data)

            setMateri(data)
            setSubmateri(data.submateri || [])

            const sub = data.submateri.find((s) => s.slug === subSlug)
            setJudul(sub?.judul || "")
            setIsi(sub?.isi || "")
        } catch (err) {
            console.error(err)
        }
    }

    useEffect(() => {
        fetchData()
    }, [materiSlug, subSlug])

    useEffect(() => {
        if (!editor || !isi) return
        setTimeout(() => {
            try {
                editor.commands.setContent(isi)
            } catch (e) {
                console.error("Gagal setContent:", e)
            }
        }, 0)
    }, [editor, isi])

    useEffect(() => {
        if (editor) {
            editor.setEditable(Boolean(editMode))
        }
    }, [editMode, editor])

    useEffect(() => {
        if (judul) {
            setJudulValue(judul)
        }
    }, [judul])

    const isAdmin = session?.user?.role === "admin"

    const handleSave = async () => {
        if (!editor || saving) return
        setSaving(true)

        const payload = {
            judul: judulValue,
            isi: editor.getHTML(),
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

    const addImage = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("image", file);

            try {
                const res = await fetch(`${baseApiUrl}/upload-image/`, {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error("Gagal upload gambar");

                const data = await res.json();
                
                const imageUrl = data.url;
                console.log("Gambar berhasil diupload:", imageUrl);

                editor.chain().focus().setImage({ src: getImageUrl(imageUrl) }).run();
            } catch (err) {
                console.error(err);
                alert("Gagal mengupload gambar");
            }
        };
        input.click();
    }

    const handleSpeak = () => {
        if (!isi) return;

        // Jika sedang membaca → hentikan
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        // Membaca isi HTML → ubah ke text biasa
        const plainText = isi.replace(/<[^>]+>/g, " ");

        const utter = new SpeechSynthesisUtterance(plainText);
        utter.lang = "id-ID"; // Bahasa Indonesia
        utter.rate = 1;       // Kecepatan
        utter.pitch = 1;      // Pitch

        utter.onend = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utter);
        setIsSpeaking(true);
    };

    useEffect(() => {
        if (!editor) return;

        editor.on('update', () => {
            forceUpdate(v => v + 1);
        });
    }, [editor]);

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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                    {/* Judul */}
                    <div>
                        {editMode ? (
                            <input
                                type="text"
                                value={judulValue}
                                onChange={(e) => setJudulValue(e.target.value)}
                                className="text-4xl font-bold mb-2 w-full bg-transparent border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 leading-normal"
                                placeholder="Judul materi"
                            />
                        ) : (
                            <h1 className="text-4xl text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-normal">
                                {judulValue}
                            </h1>
                        )}
                        <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
                    </div>

                    {/* Tombol Speaker */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSpeak}
                            className={`flex items-center gap-2 p-3 border rounded-xl transition-all
                                ${isSpeaking 
                                    ? "bg-red-50 border-red-200 text-red-600 hover:from-red-100 hover:to-red-200 hover:shadow-red-500/20"
                                    : "bg-white border-gray-200/50 text-gray-700 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100 hover:text-green-600 hover:border-green-200 hover:shadow-green-500/20"
                                }
                            `}
                        >
                            {isSpeaking ? (
                                <>
                                    <VolumeOff className="w-5 h-5" />
                                    <span className="font-medium">Stop</span>
                                </>
                            ) : (
                                <>
                                    <Volume2 className="w-5 h-5" />
                                    <span className="font-medium">Baca</span>
                                </>
                            )}
                        </button>

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

                <div
                    className={`rounded-xl text-black transition-all duration-200 ${
                        editMode ? "" : ""
                    }`}
                >
                    {editMode && editor && (
                        <div className="sticky top-0 z-50 flex flex-wrap gap-2 mb-4 bg-white/80 p-2 rounded-lg border">
                            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive("bold") ? "bg-blue-500 text-white" : "bg-gray-100"}`}><Bold size={16} /></button>
                            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive("italic") ? "bg-blue-500 text-white" : "bg-gray-100"}`}><Italic size={16} /></button>
                            <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-2 rounded ${editor.isActive("underline") ? "bg-blue-500 text-white" : "bg-gray-100"}`}><UnderlineIcon size={16} /></button>
                            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive("bulletList") ? "bg-blue-500 text-white" : "bg-gray-100"}`}><List size={16} /></button>
                            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive("orderedList") ? "bg-blue-500 text-white" : "bg-gray-100"}`}><ListOrdered size={16} /></button>
                            <button onClick={() => editor.chain().focus().setTextAlign("left").run()} className={`p-2 rounded ${editor.isActive({ textAlign: "left" }) ? "bg-blue-500 text-white" : "bg-gray-100"}`}><AlignLeft size={16} /></button>
                            <button onClick={() => editor.chain().focus().setTextAlign("center").run()} className={`p-2 rounded ${editor.isActive({ textAlign: "center" }) ? "bg-blue-500 text-white" : "bg-gray-100"}`}><AlignCenter size={16} /></button>
                            <button onClick={() => editor.chain().focus().setTextAlign("right").run()} className={`p-2 rounded ${editor.isActive({ textAlign: "right" }) ? "bg-blue-500 text-white" : "bg-gray-100"}`}><AlignRight size={16} /></button>
                            <button onClick={() => editor.chain().focus().setTextAlign("justify").run()} className={`p-2 rounded ${editor.isActive({ textAlign: "justify" }) ? "bg-blue-500 text-white" : "bg-gray-100"}`}><AlignJustify size={16} /></button>

                            <button onClick={addImage} className="p-2 rounded bg-gray-100"><Image size={16} /></button>

                            <button onClick={() => editor.chain().focus().undo().run()} className="p-2 rounded bg-gray-100" disabled={!editor.can().undo()}><Undo2 size={16} /></button>
                            <button onClick={() => editor.chain().focus().redo().run()} className="p-2 rounded bg-gray-100" disabled={!editor.can().redo()}><Redo2 size={16} /></button>
                        </div>
                    )}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-10 shadow-xl transition-shadow max-sm:p-4 max-sm:w-full max-sm:rounded-xl">
                        <div className="max-w-none text-gray-700 leading-relaxed text-lg max-sm:text-base max-sm:leading-normal tiptap">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>

                {isAdmin && editMode && (
                    <div className="mt-4 space-x-3">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={saving}>
                                    {saving ? "Menyimpan..." : "Simpan"}
                                </button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Simpan Materi?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Materi ini akan disimpan di database. Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                        <AlertDialogDescription className="mt-2">
                                            Pastikan semua perubahan sudah benar sebelum menyimpan.
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
                        <button onClick={() => setEditMode(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500" disabled={saving}>Batal</button>
                    </div>
                )}
                <ChatWidget materiSlug={materi.slug} subSlug={subSlug} />
            </div>
        </main>
    )
}