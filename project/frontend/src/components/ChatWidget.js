"use client"
import { useState, useEffect, useRef } from "react"
import { getCookie } from "@/utils/csrf"
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react";
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function ChatWidget({ materiSlug = null, subSlug = null }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([]) // {role: 'user'|'assistant', content}
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isFirstMessage, setIsFirstMessage] = useState(true)
  const bottomRef = useRef()
  const baseApiUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL

  useEffect(() => {
    if (open) {
      // optional: focus input on open
      const el = document.getElementById("chat-input")
      el?.focus()
    }
  }, [open])

  useEffect(()=> {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: `Halo! Kamu sedang membuka materi ${formatSlug(subSlug)}. Ada bagian yang ingin dijelaskan?`
        }
      ]);
    }
  }, [open]);

  const formatSlug = (slug) =>
    slug
      .replace(/-/g, " ")        // ganti - jadi spasi
      .replace(/\b\w/g, (c) => c.toUpperCase());  // uppercase setiap kata
      
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      // ambil history kecuali pesan terakhir yang baru dikirim
      const historyToSend = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const res = await fetch(`${baseApiUrl}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
        body: JSON.stringify({
          message: userMsg,
          materi_slug: materiSlug,
          sub_slug: subSlug,

          // 👇 tambahan penting
          first_message: isFirstMessage,
          history: historyToSend,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data.reply },
        ]);

        // setelah pesan pertama → matikan first_message
        if (isFirstMessage) {
          setIsFirstMessage(false);
        }
      } else {
        console.error(data);
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Terjadi error dari server." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Gagal menghubungi server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    {/* Floating Button */}
    <button
      onClick={() => setOpen(!open)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group"
    >
      {/* Label "Tanya AI" */}
      {!open && (
        <div className="px-4 py-2 bg-white text-gray-800 rounded-full shadow-lg font-medium text-sm
                        border border-gray-200 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0
                        transition-all duration-300 whitespace-nowrap select-none">
          Tanya AI
        </div>
      )}

      {/* Button bulat */}
      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 
                      text-white rounded-full shadow-2xl hover:shadow-blue-500/50 
                      transition-all group-hover:scale-110 flex items-center justify-center relative">
        {open ? (
          <X className="w-7 h-7" />
        ) : (
          <>
            <MessageCircle className="w-7 h-7 transition-transform group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </>
        )}
      </div>
    </button>

    {/* Chat Drawer */}
    {open && (
      <div className="fixed bottom-24 right-6 w-[90vw] max-w-[380px] h-[70vh] max-h-[600px] md:max-w-[480px] md:h-[80vh] bg-white rounded-2xl shadow-2xl border border-gray-200/50 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300 flex flex-col z-50 animate-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white">AI Assistant</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs text-white/80">Online</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4" id="chat-body">
          {messages.length === 0 && (
            <p className="text-sm text-gray-500">
              Ajukan pertanyaan terkait materi ini — saya akan menjawab berdasarkan konten pembelajaran.
            </p>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-500">AI Assistant</span>
                  </div>
                )}

                <div
                  className={`prose prose-sm max-w-none
                    prose-p:leading-relaxed
                    prose-strong:font-semibold
                    prose-code:bg-gray-200 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-white
                    ${m.role === "user" ? "prose-invert text-white" : ""}
                  `}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
            />

            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    )}
    </>
  );
}
