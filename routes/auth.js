const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Register/Admit User
router.post('/register', async (req, res) => {
  try {
    const { fullName, idNo, phone, email, ministry, dateJoined, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { idNo }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this Email, ID No, or Phone already exists' });
    }

    // Set phone as default password if none provided
    const password = req.body.password || phone;

    const user = new User({ 
      fullName, 
      idNo, 
      phone, 
      email, 
      ministry, 
      dateJoined, 
      password,
      role: role || 'member'
    });
    await user.save();

    res.status(201).json({ message: 'User admitted successfully', user: { id: user._id, fullName: user.fullName } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
