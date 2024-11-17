const logger = require('./logger')
const morgan = require('morgan')
const jwt = require('jsonwebtoken')
const User = require('../models/user')

morgan.token('body', (request, _response) => {
    if (request.body) {
        let temp = {
            title: request.body.title,
            author: request.body.author,
            url: request.body.url,
            likes: request.body.likes,
            username: request.body.username
        }
        return `request body: ${JSON.stringify(temp)}`
    } else {
        return '{}'
    }
})

const requestLogger = (request, response, next) => {
    logger.info('method:', request.method)
    logger.info('url:  ', request.path)
    logger.info('body:  ', request.body)
    logger.info('header: ', request.header.authorization)
    logger.info('---')
    next()
}

const unknownEndPoint = (request, response) => {
    response.status(404).send({ error: "unknown endpoint" })
}


const extractUser = async (request, response, next) => {

    const authorization = request.get('authorization')
    logger.info('authorization: ', authorization)
    if (authorization && authorization.startsWith('Bearer')) {
        const token = authorization.replace('Bearer ', '')
        if (!token) {
            response.status(401).json({ error: "JWT is required" })
        }
        request.token = token
    } else {
        response.status(401).json({ error: "JWT is required" })
    }

    const { username, id } = jwt.verify(request.token, process.env.SECRET)

    request.user = await User.findById(id)

    next()
}

const errorHandler = (error, request, response, next) => {
    logger.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).json({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.name === 'MongoServerError' && error.message.includes('E11000 duplicate key error')) {
        return response.status(400).json({ error: "expected username to be unique" })
    } else if (error.name === 'TokenExpiredError') {
        return response.status(401).json({ error: 'TokenExpiredError' })
    } else if (error.name === 'JsonWebTokenError') {
        return response.status(400).json({ error: error.message })
    }

    next(error)
}


module.exports = {
    morgan,
    unknownEndPoint,
    extractUser,
    errorHandler,
    requestLogger
}

