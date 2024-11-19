const userRouter = require('express').Router()
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const config = require('../utils/config')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.EMAIL,
        pass: config.EMAIL_PASS
    },
})

const getMessage = (verificationLink, user) => ({
    from: 'bloglist.webapp@gmail.com',
    to: user.email,
    subject: 'Verify Your Email',
    html: `
    <h2> Welcome ${user.username}, hope you enjoy using Bloglist</h2>
    <p>To start off, please verify your email by clicking on the link below:</p><a href="${verificationLink}">Verify Email</a>
    <p>(the link is valid for 1 hour)</p>
    
    <p>see you on the other side!</p>`,
})

userRouter.post('/register', async (request, response) => {
    const { name, username, email, password } = request.body;
    const saltRounds = 10
    try {
        console.log(request)

        const existingUser = await User.findOne({ email });
        if (existingUser) return response.status(400).json({ message: 'User already exists with this email id, try logging in' });


        if (password.length < 3) {
            return response.status(400).json({ error: 'password: is expected to have at least 3 characters' })
        }

        const passwordHash = await bcrypt.hash(password, saltRounds)

        const userToAdd = new User({
            name,
            username,
            email,
            passwordHash: passwordHash,
            isVerified: false,
        })

        const token = jwt.sign({ email: userToAdd.email, id: userToAdd._id }, process.env.SECRET, { expiresIn: 60 * 60 })

        const verificationLink = `${request.protocol}://${request.get('host')}/users/verify?token=${token}`;

        // await transporter.verify((error, success) => {
        //     if (error) {
        //         console.error('Error with transporter:', error);
        //     } else {
        //         console.log('Server is ready to send emails!');
        //     }
        // });

        await transporter.sendMail(getMessage(verificationLink, userToAdd))

        await userToAdd.save()

        response.status(200).json({ message: 'Registration successful! Please check your email for verification.' });
    } catch (error) {
        response.status(500).json({ message: 'Server error', error: error.message });
    }
})


userRouter.get('/verify', async (req, res) => {
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

        response.redirect(`${process.env.FRONTEND_URL}/verification-success`);
    } catch (error) {
        res.status(400).json({ message: 'Invalid or expired token', error: error.message });
    }
})

userRouter.post('/login', async (request, response) => {
    console.log('Request Body:', request.body);
    const { email, password } = request.body

    const user = await User.findOne({ email })
    const passwordMatch = user === null ? false : await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
        return response.status(401).json({ error: 'invalid email or password' })
    }

    const userForToken = {
        email: user.email,
        id: user._id
    }

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60 * 60 })

    response.json({ token, username: user.username, name: user.name })
})

userRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })

    response.json(users)
})

module.exports = userRouter
