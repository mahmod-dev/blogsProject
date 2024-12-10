import * as yup from "yup"
import { imageFileSchema, objectIdSchema } from "../utils/validation"

export const getAllBlogPostSchema = yup.object({
    query: yup.object({
        authorId: objectIdSchema,
        page: yup.string()
    })
})
export type BlogPostQuery = yup.InferType<typeof getAllBlogPostSchema>["query"]

const titleSchema = yup.string().max(100)
const summarySchema = yup.string().max(200)
const bodySchema = yup.string().max(300)
const slugSchema = yup.string().max(100).matches(/^[a-zA-Z0-9_-]*$/)

const createPostBody = yup.object({
    title: titleSchema.required(),
    summary: summarySchema.required(),
    body: bodySchema.required(),
    slug: slugSchema.required(),
})

export type BlogPostBody = yup.InferType<typeof createPostBody>

export const createPostSchema = yup.object({
    body: createPostBody,
    file: imageFileSchema.required("Post image is required")
})



export const updatePostSchema = yup.object({
    params: yup.object({
        postId: objectIdSchema,
    }),
    body: yup.object({
        title: titleSchema,
        summary: summarySchema,
        body: bodySchema,
        slug: slugSchema,
    }),
    file: imageFileSchema,
})


export type UpdatePostBody = yup.InferType<typeof updatePostSchema>["body"]
export type UpdatePostParams = yup.InferType<typeof updatePostSchema>["params"]

export const deletePostSchema = yup.object({
    params: yup.object({
        postId: objectIdSchema,
    }),
})
export type DeletePostParams = yup.InferType<typeof updatePostSchema>["params"]
