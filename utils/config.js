require('dotenv').config()

const MONGODB_URI = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODB_URI : process.env.MONGODB_URI
const PORT = process.env.PORT
const EMAIL = process.env.EMAIL
const EMAIL_PASS = process.env.EMAIL_PASS

module.exports = {
    MONGODB_URI, PORT, EMAIL, EMAIL_PASS
}

