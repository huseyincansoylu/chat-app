import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import generateToken from "../lib/utils.js"

import cloudinary from "../lib/cloudinary.js"

export const signup = async (req, res) => {
  const { email, fullname, password } = req.body

  if (!email || !fullname || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long" })
  }

  try {
    const existingEmail = await User.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      email,
      fullname,
      password: hashedPassword,
    })

    // user without password
    const userWithoutPassword = user.toObject()
    delete userWithoutPassword.password

    if (!user) {
      return res.status(400).json({ message: "User data not valid" })
    }
    // generate token and send it to the user
    const token = generateToken(user._id)

    // send token http only cookie
    res
      .cookie("token", token, {
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV !== "development",
      })
      .status(201)
      .json({ message: "User created successfully", user: userWithoutPassword })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // user without password
    const userWithoutPassword = user.toObject()
    delete userWithoutPassword.password

    // generate token
    const token = generateToken(user._id)

    // send token in http only cookie
    res
      .cookie("token", token, {
        sameSite: "strict",
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
        secure: process.env.NODE_ENV !== "development",
      })
      .status(200)
      .json({ message: "Logged in successfully", user: userWithoutPassword })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: 0,
    })
    res.status(200).json({ message: "Logged out successfully" })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const updateProfile = async (req, res) => {
  const { profilePic } = req.body

  const userId = req.user._id

  if (!profilePic) {
    return res.status(400).json({ message: "Profile picture is required" })
  }

  try {
    const uploadedResponse = await cloudinary.uploader.upload(profilePic)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadedResponse.secure_url },
      { new: true }
    ).select("-password")

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const checkAuth = async (req, res) => {
  try {
    res.status(200).json({ user: req.user })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Internal server error" })
  }
}
