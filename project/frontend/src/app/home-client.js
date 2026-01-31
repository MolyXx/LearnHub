"use client"
import { signIn, useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { BookOpen, Sparkles } from 'lucide-react';
import { useSearchParams } from "next/navigation"

export default function Home() {
  const { data: session, status } = useSession()
  const params = useSearchParams();
  const error = params.get("error");

  if (status === "loading") {
    return (
      <div className="flex flex-col justify-center items-center h-screen gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (session) {
    redirect("/materi")
  }

  return (
     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl mb-4 shadow-2xl shadow-blue-500/30">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LearnHub
            </span>
          </h1>
          <p className="text-gray-600">Website Pembelajaran Dengan Asisten AI</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl border border-gray-200/50 p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl text-gray-900 mb-2">Welcome Back!</h2>
            <p className="text-gray-600 text-sm">Sign in to continue your learning journey</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg text-center">
              {error === "OAuthCallback" && "Silahkan coba lagi"}
              {error === "OAuthAccountNotLinked" && "Akun ini sudah terhubung metode login lain."}
              {error === "AccessDenied" && "Akses ditolak."}
              {error === "Configuration" && "Kesalahan konfigurasi server."}
              {!["OAuthCallback","OAuthAccountNotLinked","AccessDenied","Configuration"].includes(error)
                && "Terjadi kesalahan login."}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-4 hover:bg-gray-50 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/20 transition-all group active:scale-95"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 group-hover:text-gray-900 transition-colors">
              Continue with Google
            </span>
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Secure authentication</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
              <span>Akses semua materi pembelajaran Anda</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-600" />
              </div>
              <span>Nikmati pengalaman belajar yang lebih terstruktur</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <span>Dapatkan bantuan pembelajaran dengan asisten AI</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="fixed top-10 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-10 right-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -z-10"></div>
    </div>
  )
}
