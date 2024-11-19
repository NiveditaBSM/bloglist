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

userRouter.post('/', async (request, response) => {
    const { name, username, email, password } = request.body;
    try {
        const saltRounds = 10

        const existingUser = await User.findOne({ email });
        if (existingUser) return response.status(400).json({
            error: 'Duplicate user',
            message: 'User already exists with this email id, try logging in'
        });


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

        await userToAdd.save()

        const userForToken = {
            username: userToAdd.username,
            id: userToAdd._id
        }

        //const token = jwt.sign(userToAdd.id, process.env.SECRET, { expiresIn: 60 * 60 })
        const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60 * 60 })

        const verificationLink = `${request.protocol}://${request.get('host')}/users/verify?token=${token}`;

        // await transporter.verify((error, success) => {
        //     if (error) {
        //         console.error('Error with transporter:', error);
        //     } else {
        //         console.log('Server is ready to send emails!');
        //     }
        // });

        await transporter.sendMail({
            from: 'bloglist.webapp@gmail.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Please verify your email by clicking on the link below:</p><a href="${verificationLink}">Verify Email</a>
        <p>the link is valid for 1 hour</p>`,
        })
        response.status(200).json({
            message: 'Registration successful! Please check your email for verification.'
        });
    } catch (error) {
        response.status(500).json({ message: 'Server error', error: error.message });
    }
})

userRouter.get('/', async (request, response) => {
    const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1 })

    response.json(users)
})

module.exports = userRouter
