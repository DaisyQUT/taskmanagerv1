
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { validateRegistration } = require('../utils/validateRegistration');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// ALN-9: registration, server-side validation and consent.
const registerUser = async (req, res) => {
    const errors = validateRegistration(req.body);
    if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: 'Please correct the highlighted fields.', errors });
    }

    const email = req.body.email.trim().toLowerCase();
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: 'Please correct the highlighted fields.',
                errors: { email: 'An account with this email already exists' },
            });
        }

        // Only these fields are copied from the request, so nobody can set their own status.
        const user = await User.create({
            name: req.body.name.trim(),
            email,
            password: req.body.password,
            institution: req.body.institution.trim(),
            degree: req.body.degree.trim(),
            graduationYear: Number(req.body.graduationYear),
            studentId: req.body.studentId.trim(),
            verificationLink: req.body.verificationLink.trim(),
            consentAt: new Date(),
        });

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            verificationStatus: user.verificationStatus,
            token: generateToken(user.id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { password } = req.body;
    const email = (req.body.email || '').trim().toLowerCase();
    try {
        const user = await User.findOne({ email });
        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({ id: user.id, name: user.name, email: user.email, token: generateToken(user.id) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        name: user.name,
        email: user.email,
        institution: user.institution,
      });

    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

const updateUserProfile = async (req, res) => {
  try {
    // must be authenticated to update profile
    const user = await User.findById(req.user.id);

    if (user) {
      const { name, email, institution } = req.body;
      user.name = name || user.name;
      user.email = email || user.email;
      user.institution = institution || user.institution;

      const updatedUser = await user.save();

      res.json({
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        institution: updatedUser.institution,
        token: generateToken(updatedUser.id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, updateUserProfile, getProfile };
