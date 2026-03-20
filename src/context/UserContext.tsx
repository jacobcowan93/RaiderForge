"use client"

import React, { createContext, useContext, ReactNode } from 'react'
import { useSession } from 'next-auth/react'

// Replace mock user with NextAuth session
export const useAuth = () => {
    const { data: session, status } = useSession()
    return { user: session?.user, status }
}

// Keep the old UserProvider for now if needed, but we'll use useAuth instead
type User = {
    userId: string
    username: string
}

type UserContextValue = {
    user: User
    setUser: (u: User) => void
}

const defaultUser: User = { userId: 'user-123', username: 'TestRaider' }

const UserContext = createContext<UserContextValue | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = React.useState<User>(defaultUser)
    return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

export const useMockUser = () => {
    const ctx = useContext(UserContext)
    if (!ctx) throw new Error('useMockUser must be used within UserProvider')
    return ctx
}
