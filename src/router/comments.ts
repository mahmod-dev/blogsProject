import express from "express"
import * as commmentController from "../controller/comment"
import { requireAuth } from "../middlewares/requireAuth"
import validateRequestSchema from "../middlewares/validatRequestSchema"
import { createCommentSchema, deleteCommentSchema, getCommentsRepliesSchema, getCommentsSchema, updateCommentSchema } from "../validation/comment"

const router = express.Router()

router.get("/:blogPostId/comments", validateRequestSchema(getCommentsSchema), commmentController.getCommentsForPosts)
router.post("/:blogPostId/comments", requireAuth, validateRequestSchema(createCommentSchema), commmentController.createComment)
router.get("/comments/:commentId/replies", validateRequestSchema(getCommentsRepliesSchema), commmentController.getCommentReplies)
router.patch("/comments/:commentId",requireAuth, validateRequestSchema(updateCommentSchema), commmentController.updateComment)
router.delete("/comments/:commentId", validateRequestSchema(deleteCommentSchema), commmentController.deleteComment)

export default router