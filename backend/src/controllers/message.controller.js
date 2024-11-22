import User from "../models/user.model.js"
import Message from "../models/message.model.js"
import cloudinary from "../lib/cloudinary.js"
import { getReceiverSocketId, io } from "../lib/socket.js"

export const getUsers = async (req, res) => {
  try {
    // get all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } }).select(
      "-password"
    )

    res.status(200).json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params
    // İki kullanıcı arasındaki mesajları al

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: userId },
        { senderId: userId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1 })

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body

    let imageUrl = null

    if (image) {
      const upload = await cloudinary.uploader.upload(image)
      imageUrl = upload.secure_url
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId: req.params.id,
      text,
      image: imageUrl,
    })

    const receiverSocketId = getReceiverSocketId(req.params.id)

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message)
    }

    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
