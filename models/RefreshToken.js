import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const refreshTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // TTL index - MongoDB will auto-delete expired tokens
        },
    },
    {
        timestamps: true,
    }
);

// Hash token before saving
refreshTokenSchema.pre('save', async function (next) {
    if (!this.isModified('token')) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.token = await bcrypt.hash(this.token, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare tokens
refreshTokenSchema.methods.compareToken = async function (candidateToken) {
    try {
        return await bcrypt.compare(candidateToken, this.token);
    } catch (error) {
        throw new Error('Token comparison failed');
    }
};

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
