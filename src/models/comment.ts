import mongoose, { InferSchemaType, model, Schema } from "mongoose";

const commentSchema = new Schema({
    blogPostId: { type: mongoose.Schema.Types.ObjectId, required: true },
    parentCommentId: { type: mongoose.Schema.Types.ObjectId },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    text: { type: String, required: true }

}, { timestamps: true })

type Comment = InferSchemaType<typeof commentSchema>
export default model<Comment>("comment", commentSchema)