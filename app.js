const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const blogRouter = require('./controllers/blogs')
const userRouter = require('./controllers/users')
const middleware = require('./utils/middleware')
const logger = require('./utils/logger')
const config = require('./utils/config')


mongoose.connect(config.MONGODB_URI).then(result =>
    logger.info('connected to mongoDB')
).catch(error =>
    logger.error('error connecting to mongoDB', error.message)
)

mongoose.set('strictQuery', false)

app.use(cors())
app.use(express.static('dist'))
app.use(express.json())

if (process.env.NODE_ENV !== 'test') {
    app.use(middleware.requestLogger)
    app.use(middleware.morgan(':status :res[content-length] - :response-time ms'))
}

app.use('/api/blogs', blogRouter)
app.use('/api/users', userRouter)

app.use(middleware.unknownEndPoint)
app.use(middleware.errorHandler)

module.exports = app









