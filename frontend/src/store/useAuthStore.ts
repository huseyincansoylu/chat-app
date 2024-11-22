import { create } from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { io, Socket } from "socket.io-client"

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/"

interface User {
  _id: string
  email: string
  fullname: string
  profilePic: string
  createdAt: string
}

interface AuthStore {
  authUser: User | null
  setAuthUser: (user: User | null) => void
  checkAuth: () => Promise<void>
  signup: (data: {
    email: string
    fullname: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
  login: (data: { email: string; password: string }) => Promise<void>
  updateProfile: (data: { profilePic: any }) => Promise<void>

  //loading states
  isCheckingAuth: boolean
  isSigningUp: boolean
  isLoggingIn: boolean
  isUpdatingProfile: boolean

  onlineUsers: string[]
  socket: Socket | null
  connectSocket: () => void
  disconnectSocket: () => void
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  onlineUsers: [],
  socket: null,
  setAuthUser: (user: User | null) => set({ authUser: user }),
  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/auth/check")
      set({ authUser: response.data.user, isCheckingAuth: false })
      get().connectSocket()
    } catch (error) {
      set({ isCheckingAuth: false })
    }
  },
  signup: async (data: {
    email: string
    fullname: string
    password: string
  }) => {
    set({ isSigningUp: true })
    try {
      const response = await axiosInstance.post("/auth/signup", data)
      toast.success(response.data.message)
      get().connectSocket()
      set({ authUser: response.data.user, isSigningUp: false })
    } catch (error) {
      toast.error((error as any).response.data.message)
      console.log(error)
    } finally {
      set({ isSigningUp: false })
    }
  },
  login: async (data: { email: string; password: string }) => {
    set({ isLoggingIn: true })
    try {
      const response = await axiosInstance.post("/auth/login", data)
      toast.success(response.data.message)

      get().connectSocket()

      set({ authUser: response.data.user, isLoggingIn: false })
    } catch (error) {
      toast.error((error as any).response.data.message)
    } finally {
      set({ isLoggingIn: false })
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout")
      set({ authUser: null })
      toast.success("Logged out successfully")
      get().disconnectSocket()
    } catch (error) {
      toast.error((error as any).response.data.message)
    }
  },
  updateProfile: async (data: { profilePic: any }) => {
    set({ isUpdatingProfile: true })
    try {
      const response = await axiosInstance.put("/auth/update-profile", data)
      set({ authUser: response.data.user, isUpdatingProfile: false })
    } catch (error) {
      toast.error((error as any).response.data.message)
    } finally {
      set({ isUpdatingProfile: false })
    }
  },

  connectSocket: () => {
    const { authUser } = get()

    if (!authUser || get().socket?.connected) return

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    })
    socket.connect()
    set({ socket })

    socket.on("connectedUsers", (users) => {
      set({ onlineUsers: users })
    })
  },

  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket?.disconnect()
    }
  },
}))
