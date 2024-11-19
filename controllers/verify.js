const verifyRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')

verifyRouter.get('/', async (req, res) => {
    const { token } = req.query;
    try {
        // Verify the token
        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded.id);

        if (!user) return res.status(400).json({ message: 'Invalid token' });
        if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

        // Update the user status
        user.isVerified = true;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully!' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token', error: error.message });
    }
});

module.exports = verifyRouter