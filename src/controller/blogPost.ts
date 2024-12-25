import { RequestHandler } from "express";
import blogPost from "../models/blogPost";
import BlogPostModel from "../database/models/blogPost";
import assertIsDefined from "../utils/assertIsDefined";
import env from "../env";
import sharp from "sharp";
import createHttpError from "http-errors";
import { BlogPostQuery, DeletePostParams, UpdatePostBody, UpdatePostParams } from "../validation/blogPost";
import fs from "fs"
import UserModel from "../database/models/user";
import { v4 as uuidv4 } from "uuid"

export const getAllBlogPost: RequestHandler<unknown, unknown, unknown, BlogPostQuery> = async (req, res, next) => {
    try {
        const authorId = req.query.authorId
        const filter = authorId ? { authorId } : {} //episode 23 
        const page = parseInt((req.query.page || "1"))
        const pageSize = 50

        const allPostsQuery = BlogPostModel.findAll({
            limit: pageSize,
            offset: (page - 1) * pageSize,

        })

        const countDocumentQuery = BlogPostModel.count({ where: filter })
        const [allPosts, totalResult] = await Promise.all([allPostsQuery, countDocumentQuery])
        const totalPages = Math.ceil(totalResult / pageSize)
        res.status(200).json({
            allPosts,
            page,
            totalPages
        })

    } catch (error) {
        next(error)
    }
}

export const getAllSlugs: RequestHandler = async (req, res, next) => {
    try {
        const blogsSlugs = await BlogPostModel.unscoped().findAll({ attributes: ["slug"] });
        const slugs = blogsSlugs.map(post => post.slug)

        res.status(200).json(slugs)

    } catch (error) {
        next(error)
    }
}

export const getPostBySlug: RequestHandler = async (req, res, next) => {
    try {
        const slug = req.params.slug
        const postBySlug = await BlogPostModel.findOne({ where: { slug } })
        if (!postBySlug) {
            throw createHttpError(400, "No blog post found for this slug");
        }
        res.status(200).json(postBySlug)

    } catch (error) {
        next(error)
    }
}

interface BlogPostBody {
    slug: string,
    title: string,
    body: string,
    summary: string,
}
export const createPost: RequestHandler<unknown, unknown, BlogPostBody, unknown> = async (req, res, next) => {

    try {
        const { slug, title, summary, body } = req.body
        const image = req.file;
        const author = req.user
        assertIsDefined(image)
        assertIsDefined(author)
        const postId = uuidv4()
        console.log("postId: " + postId)

        const imagePath = "/uploads/post-images/" + postId + ".png"

        await sharp(image.buffer)
            .resize(700, 450)
            .toFile("." + imagePath)

        const newPost = await BlogPostModel.create({
            _id: postId,
            slug,
            title,
            summary,
            body,
            imgUrl: env.SERVER_URL + imagePath + "?lastupdated=" + Date.now(),
            authorId: author._id
        },
            {
                include: UserModel,
            })
        res.status(200).json(newPost)

    } catch (error) {
        next(error)
    }
}

export const updatePost: RequestHandler<UpdatePostParams, unknown, UpdatePostBody, unknown> = async (req, res, next) => {
    try {
        const { title, slug, body, summary } = req.body
        const postImage = req.file
        const authenticatedUser = req.user
        const postId = req.params.postId
        assertIsDefined(postId)
        assertIsDefined(authenticatedUser)
        let imagePath: string | undefined

        const existingSlug = await BlogPostModel.findOne({ where: { slug } })

        if (existingSlug) {
            throw createHttpError(409, "Slug already taken. Please choose a different one.");
        }

        const postToEdit = await BlogPostModel.findOne({ where: { postId } })
        if (!postToEdit) {
            throw createHttpError(404);
        }
        if (postToEdit.authorId !== authenticatedUser._id) {
            throw createHttpError(401);
        }

        if (postImage) {
            imagePath = "/uploads/post-images/" + postId + ".png"

            await sharp(postImage.buffer)
                .resize(700, 450)
                .toFile("." + imagePath)
        }

        const updatedPost = await BlogPostModel.update(
            {
                ...(slug && { slug }),
                ...(title && { title }),
                ...(body && { body }),
                ...(summary && { summary }),
                ...(postImage && { imgUrl: env.SERVER_URL + imagePath + "?lastupdated=" + Date.now() }),
            },
            { where: { _id: postId, }, returning: true },
        )

        /*           // this way will only work when send all fields and we should update all fields
                   postToEdit.slug = slug;
                   postToEdit.title = title;
                   postToEdit.summary = summary;
                   postToEdit.body = body;
                   await postToEdit.save();*/

        res.status(200).json(updatedPost)


    } catch (error) {
        next(error)
    }
}

export const deletePost: RequestHandler<DeletePostParams, unknown, unknown, unknown> = async (req, res, next) => {
    try {
        const postId = req.params.postId
        const authenticatedUserId = req.user?._id
        assertIsDefined(postId)
        assertIsDefined(authenticatedUserId)

        const postToDelete = await BlogPostModel.findByPk(postId)
        if (!postToDelete) {
            throw createHttpError(404)
        }
        if (postToDelete.authorId !== authenticatedUserId) {
            throw createHttpError(401)
        }
        if (postToDelete.imgUrl.startsWith(env.SERVER_URL)) {
            const imgPathToDelete = postToDelete.imgUrl.split(env.SERVER_URL)[1].split("?")[0]
            console.log(imgPathToDelete);
            fs.unlinkSync("." + imgPathToDelete)
        }

        await postToDelete.destroy()
        res.status(200).json({ "message": "success deleted" })

    } catch (error) {
        next(error)
    }
}