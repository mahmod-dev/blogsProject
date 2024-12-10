import { InferSchemaType, model, Schema } from "mongoose";

const userSchema = new Schema({
    username: { type: String, unique: true, sparse: true },
    email: { type: String, unique: true, sparse: true, select: false },
    profilePicUrl: { type: String },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, select: false },
    githubId: { type: String, unique: true, sparse: true, select: false },
    displayName: { type: String },
    about: { type: String },
}, { timestamps: true })

userSchema.pre("validate", function (next) {
    if (!this.email && !this.googleId && !this.githubId) {
        return next(new Error("User must have an email or social provider id"));
    }
    next()
})

type Users = InferSchemaType<typeof userSchema>
export default model<Users>("users", userSchema)
