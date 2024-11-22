import { create } from "zustand"
import { axiosInstance } from "../lib/axios"
import toast from "react-hot-toast"
import { useAuthStore } from "./useAuthStore"

interface User {
  _id: string
  fullname: string
  profilePic: string
}

interface Message {
  _id?: string | null
  text?: string | null
  image?: string | null
  senderId?: string | null
  receiverId?: string | null
  createdAt?: string | null
}

interface ChatStore {
  messages: Message[]
  users: User[]
  selectedUser: User | null
  setSelectedUser: (user: User | null) => void
  isUsersLoading: boolean
  isMessagesLoading: boolean
  getUsers: () => Promise<void>
  getMessages: (selectedUser: User) => Promise<void>
  sendMessage: (message: Message) => Promise<void>
  subscribeToNewMessages: () => void
  unsubscribeFromNewMessages: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  setSelectedUser: (user: User | null) => set({ selectedUser: user }),
  isUsersLoading: false,
  isMessagesLoading: false,
  getUsers: async () => {
    set({ isUsersLoading: true })
    try {
      const response = await axiosInstance.get("/messages/users")
      set({ users: response.data })
    } catch (error) {
      console.log(error)
    } finally {
      set({ isUsersLoading: false })
    }
  },

  getMessages: async (selectedUser: User) => {
    set({ isMessagesLoading: true })
    try {
      const response = await axiosInstance.get(`/messages/${selectedUser._id}`)
      set({ messages: response.data })
    } catch (error) {
      console.log(error)
    } finally {
      set({ isMessagesLoading: false })
    }
  },

  sendMessage: async (message: Message) => {
    const { messages, selectedUser } = get()
    try {
      const response = await axiosInstance.post(
        `/messages/send/${selectedUser?._id}`,
        message
      )

      set({ messages: [...messages, response.data] })
    } catch (error) {
      toast.error("Something went wrong")
      console.log(error)
    }
  },
  subscribeToNewMessages: () => {
    const { selectedUser } = get()

    if (!selectedUser) return

    const socket = useAuthStore.getState().socket

    socket?.on("newMessage", (message: Message) => {
      if (message.receiverId === selectedUser._id) {
        set({ messages: [...get().messages, message] })
      }
    })
  },
  unsubscribeFromNewMessages: () => {
    const socket = useAuthStore.getState().socket
    socket?.off("newMessage")
  },
}))
