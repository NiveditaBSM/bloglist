const User = require('../models/user')
const loginRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')


loginRouter.post('/', async (request, response) => {
    console.log('Request Body:', request.body);
    const { username, password } = request.body

    const user = await User.findOne({ username })
    const passwordMatch = user === null ? false : await bcrypt.compare(password, user.passwordHash)

    if (!passwordMatch) {
        return response.status(401).json({ error: 'invalid username or password' })
    }

    const userForToken = {
        username: user.username,
        id: user._id
    }

    const token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60 * 60 })

    response.json({ token, username: user.username, name: user.name })
})

module.exports = loginRouter