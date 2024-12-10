import express from "express"
import * as blogPostController from "../controller/blogPost"
import { uploadImage } from "../middlewares/UploadImage"
import { requireAuth } from "../middlewares/requireAuth"
import { createPostSchema, deletePostSchema, getAllBlogPostSchema, updatePostSchema } from "../validation/blogPost"
import validatRequestSchema from "../middlewares/validatRequestSchema"
import { createPostRateLimit, updatePostRateLimit } from "../middlewares/rateLimit"

const router = express.Router()

router.get("/", validatRequestSchema(getAllBlogPostSchema), blogPostController.getAllBlogPost)
router.get("/slugs", blogPostController.getAllSlugs)
router.get("/post/:slug", blogPostController.getPostBySlug)
router.post("/",
    requireAuth,
    createPostRateLimit,
    uploadImage.single("postImage"),
    validatRequestSchema(createPostSchema),
    blogPostController.createPost
)
router.patch("/:postId",
    requireAuth,
    updatePostRateLimit,
    uploadImage.single("postImage"),
    validatRequestSchema(updatePostSchema),
    blogPostController.updatePost)

router.delete("/:postId", requireAuth, validatRequestSchema(deletePostSchema), blogPostController.deletePost)

export default router