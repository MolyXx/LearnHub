import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Guru Login",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/accounts/auth/guru-login/`, {
          method: 'POST',
          body: JSON.stringify(credentials),
          headers: { "Content-Type": "application/json" }
        })
        const user = await res.json()

        if (res.ok && user) {
          return user
        }
        return null
      }
    })
  ],

  pages: {
    signIn: "/", 
    error: "/",   
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/accounts/auth/google-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            access_token: account?.access_token,
            id_token: account?.id_token,
          }),
        })

        if (!res.ok) {
          console.error("Django auth failed:", await res.text())
          return false
        }

        const data = await res.json()
        user.role = data.role
        return true
      }
      return true // For credentials, user is already returned from authorize
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.role = token.role
      return session
    },
  },
})

export { handler as GET, handler as POST }
