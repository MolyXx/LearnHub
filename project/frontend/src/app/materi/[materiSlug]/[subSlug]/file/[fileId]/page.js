"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Download, FileText, FileImage, FileSpreadsheet, FileType, Volume2, StopCircle, RefreshCw } from "lucide-react"
import ChatWidget from "@/components/ChatWidget"
import FileIcon from "@/components/FileIcon"

export default function FileViewerPage() {
    const { materiSlug, subSlug, fileId } = useParams()
    const router = useRouter()
    const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [speaking, setSpeaking] = useState(false)
    const [fileContent, setFileContent] = useState(null)
    const [loadingContent, setLoadingContent] = useState(false)

    const handleReadContent = async () => {
        if (!('speechSynthesis' in window)) {
            alert("Browser tidak mendukung Text-to-Speech");
            return;
        }

        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }

        // Jika konten sudah ada, langsung baca
        if (fileContent) {
            speakText(fileContent);
            return;
        }

        setLoadingContent(true);
        try {
            const res = await fetch(`${baseApiUrl}/materi-file/${fileId}/content/`);
            if (!res.ok) throw new Error("Gagal mengambil isi file");
            
            const data = await res.json();
            if (data.content) {
                setFileContent(data.content);
                speakText(data.content);
            } else {
                alert("Konten file kosong atau tidak dapat dibaca.");
            }
        } catch (err) {
            console.error(err);
            alert("Gagal memproses file untuk dibaca.");
        } finally {
            setLoadingContent(false);
        }
    };

    const speakText = (text) => {
        window.speechSynthesis.cancel();
        
        // Split text into chunks to avoid browser limitations
        const chunks = text.match(/.{1,200}/g) || [];
        let currentChunk = 0;

        const speakChunk = () => {
            if (currentChunk >= chunks.length) {
                setSpeaking(false);
                return;
            }

            const utterance = new SpeechSynthesisUtterance(chunks[currentChunk]);
            utterance.lang = "id-ID";
            utterance.rate = 1.0;
            
            utterance.onend = () => {
                currentChunk++;
                speakChunk();
            };

            utterance.onerror = (e) => {
                if (e.error === 'canceled' || e.error === 'interrupted') {
                    // Ignore expected cancelation errors
                    return;
                }
                console.error("TTS Error:", e);
                setSpeaking(false);
            };

            window.speechSynthesis.speak(utterance);
        };

        setSpeaking(true);
        speakChunk();
    };

    // Stop speaking when leaving page
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    useEffect(() => {
        const fetchFile = async () => {
            try {
                // Fetching all files from sub-materi to find the specific one
                // Ideally backend should have an endpoint for single file, but this works with current API
                const res = await fetch(`${baseApiUrl}/materi/${materiSlug}/`)
                const data = await res.json()
                const sub = data.submateri.find(s => s.slug === subSlug)
                
                if (sub) {
                    const foundFile = sub.files.find(f => f.id.toString() === fileId)
                    setFile(foundFile)
                }
            } catch (err) {
                console.error("Error fetching file:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchFile()
    }, [materiSlug, subSlug, fileId, baseApiUrl])

    // Helper to get file URL
    const getFileUrl = (path) => {
        if (!path) return "#";
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        return `${baseApiUrl}${path}`;
    };

    const getFileType = (filename) => {
        if (!filename) return 'unknown';
        const cleanFilename = filename.split('?')[0];
        const ext = cleanFilename.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (ext === 'pdf') return 'pdf';
        if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'office';
        return 'other';
    }

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!file) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h1 className="text-2xl font-bold text-gray-800">File tidak ditemukan</h1>
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-blue-600 hover:underline"
                >
                    <ArrowLeft size={20} /> Kembali
                </button>
            </div>
        )
    }

    const type = getFileType(file.file)
    const url = getFileUrl(file.file)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div className="flex items-center gap-3">
                         <div className="flex-shrink-0">
                            <FileIcon filename={file.file} className="w-10 h-10" />
                        </div>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg truncate max-w-xl">{file.judul}</h1>
                            <p className="text-sm text-gray-500 hidden md:block">Materi: {subSlug}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReadContent}
                        disabled={loadingContent}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
                            speaking 
                            ? "bg-red-50 text-red-600 hover:bg-red-100" 
                            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                        }`}
                    >
                        {loadingContent ? (
                            <RefreshCw size={18} className="animate-spin" />
                        ) : speaking ? (
                            <>
                                <StopCircle size={18} />
                                <span className="hidden sm:inline">Stop Baca</span>
                            </>
                        ) : (
                            <>
                                <Volume2 size={18} />
                                <span className="hidden sm:inline">Baca Isi File</span>
                            </>
                        )}
                    </button>

                    <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                    >
                        <Download size={18} />
                        <span className="hidden sm:inline">Download</span>
                    </a>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 relative overflow-hidden">
                {type === 'pdf' && (
                    <iframe 
                        src={url} 
                        className="w-full h-full border-none"
                        title="PDF Viewer"
                    />
                )}
                {type === 'image' && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto p-4">
                        <img 
                            src={url} 
                            alt={file.judul} 
                            className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                        />
                    </div>
                )}
                {type === 'office' && (
                    <iframe 
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                        className="w-full h-full border-none"
                        title="Office Viewer"
                    />
                )}
                {type === 'other' && (
                    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
                        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                            <FileText size={48} className="text-gray-500" />
                        </div>
                        <div className="max-w-md">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview tidak tersedia</h2>
                            <p className="text-gray-500 mb-6">Format file ini tidak mendukung preview langsung di browser. Silakan download untuk melihat isinya.</p>
                            <a 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30"
                            >
                                <Download size={20} /> Download File
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat Widget */}
            <ChatWidget materiSlug={materiSlug} subSlug={subSlug} />
        </div>
    )
}
