const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    blogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog'
    }],
    name: String,
    name: {
        type: String,
        required: [true, 'is required'],
    },
    username: {
        type: String,
        minLength: [3, 'is expected to have at least 3 characters'],
        required: [true, 'is required'],
    },
    email: {
        type: String,
        required: [true, 'is required'],
    },
    passwordHash: {
        type: String,
        required: [true, 'is required']
    },
    isVerified: { type: Boolean, default: false },
}, { timestamps: true })

userSchema.set('toJSON', {
    transform: (document, requiredObject) => {
        requiredObject.id = requiredObject._id
        delete requiredObject._id
        delete requiredObject.__v
        delete requiredObject.passwordHash
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User