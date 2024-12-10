import { InferSchemaType, model, Schema } from "mongoose";


const passwordResetSchema = new Schema({
    email: { type: String, required: true },
    verificationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now(), expire: "10m" }
})

type ResetPassword = InferSchemaType<typeof passwordResetSchema>
export default model<ResetPassword>("ResetPassword", passwordResetSchema)