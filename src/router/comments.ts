import express from "express"
import * as commmentController from "../controller/comment"
import { requireAuthJwt, validateExpirationJWT } from "../middlewares/requireAuth"
import validateRequestSchema from "../middlewares/validateRequestSchema"
import { createCommentSchema, deleteCommentSchema, getCommentsRepliesSchema, getCommentsSchema, updateCommentSchema } from "../validation/comment"

const router = express.Router()

router.get("/:blogPostId/comments", validateRequestSchema(getCommentsSchema), commmentController.getCommentsForPosts)
router.post("/:blogPostId/comments", requireAuthJwt, validateExpirationJWT, validateRequestSchema(createCommentSchema), commmentController.createComment)
router.get("/comments/:commentId/replies", validateRequestSchema(getCommentsRepliesSchema), commmentController.getCommentReplies)
router.patch("/comments/:commentId", requireAuthJwt,validateExpirationJWT, validateRequestSchema(updateCommentSchema), commmentController.updateComment)
router.delete("/comments/:commentId", validateRequestSchema(deleteCommentSchema), commmentController.deleteComment)

export default router