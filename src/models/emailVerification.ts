import { InferSchemaType, model, Schema } from "mongoose";

const emailSchema = new Schema({
    email: { type: String, required: true },
    verificationCode: { type: String, required: true },
    createdAt: { type: Date, default: Date.now(), expire: "10m" }
})

type Email = InferSchemaType<typeof emailSchema>
export default model<Email>("EmailVerification", emailSchema)