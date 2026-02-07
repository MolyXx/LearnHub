"use client"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { useState, useEffect } from "react"
import { UserPlus, Users, Trash2 } from 'lucide-react'

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const [gurus, setGurus] = useState([])
  const [newGuru, setNewGuru] = useState({ username: "", email: "", password: "" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "authenticated") {
        if (session?.user?.role !== "admin") {
            redirect("/")
        } else {
            fetchGurus()
        }
    } else if (status === "unauthenticated") {
        redirect("/")
    }
  }, [status, session])

  const fetchGurus = async () => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/accounts/auth/list-gurus/`)
        if (res.ok) {
            const data = await res.json()
            setGurus(data)
        }
    } catch (error) {
        console.error("Failed to fetch gurus", error)
    } finally {
        setLoading(false)
    }
  }

  const handleCreateGuru = async (e) => {
    e.preventDefault()
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/accounts/auth/create-guru/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newGuru)
        })
        if (res.ok) {
            setNewGuru({ username: "", email: "", password: "" })
            fetchGurus()
            alert("Guru created successfully")
        } else {
            const data = await res.json()
            alert(data.error || "Failed to create guru")
        }
    } catch (error) {
        alert("Error creating guru")
    }
  }

  if (status === "loading" || loading) return <div className="p-8">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Admin Dashboard - Manajemen Guru
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Guru Form */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-600" />
                    Tambah Guru
                </h2>
                <form onSubmit={handleCreateGuru} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newGuru.username}
                            onChange={(e) => setNewGuru({...newGuru, username: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newGuru.email}
                            onChange={(e) => setNewGuru({...newGuru, email: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newGuru.password}
                            onChange={(e) => setNewGuru({...newGuru, password: e.target.value})}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Buat Akun
                    </button>
                </form>
            </div>

            {/* List Gurus */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Daftar Guru</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="pb-3 font-medium text-gray-500">ID</th>
                                <th className="pb-3 font-medium text-gray-500">Username</th>
                                <th className="pb-3 font-medium text-gray-500">Email</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {gurus.map((guru) => (
                                <tr key={guru.id} className="group hover:bg-gray-50">
                                    <td className="py-3 text-gray-500">{guru.id}</td>
                                    <td className="py-3 font-medium text-gray-900">{guru.username}</td>
                                    <td className="py-3 text-gray-600">{guru.email}</td>
                                </tr>
                            ))}
                            {gurus.length === 0 && (
                                <tr>
                                    <td colSpan="3" className="py-8 text-center text-gray-500">
                                        Belum ada guru.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
