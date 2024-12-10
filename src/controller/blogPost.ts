import { RequestHandler } from "express";
import blogPost from "../models/blogPost";
import assertIsDefined from "../utils/assertIsDefined";
import mongoose from "mongoose";
import env from "../env";
import sharp from "sharp";
import createHttpError from "http-errors";
import { BlogPostQuery, DeletePostParams, UpdatePostBody, UpdatePostParams } from "../validation/blogPost";
import fs from "fs"

export const getAllBlogPost: RequestHandler<unknown, unknown, unknown, BlogPostQuery> = async (req, res, next) => {
    try {
        const authorId = req.query.authorId
        const filter = authorId ? { author: authorId } : {} //episode 23 
        const page = parseInt((req.query.page || "1"))
        const pageSize = 50

        const allPostsQuery = blogPost
            .find(filter)
            .sort({ _id: -1 }) // to sort from newest to oldest
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate("author") // to fetch author object inside blogs object
            .exec()

        const countDocumentQuery = blogPost.countDocuments(filter).exec()
        const [allPosts, totalResult] = await Promise.all([allPostsQuery, countDocumentQuery])
        const totalPages = Math.ceil(totalResult / pageSize)
        res.status(200).json({
            allPosts,
            page,
            totalPages
        })

    } catch (error) {
        next(error)
        /**
         *  res.status(500).json({ error })
         * {
         *      error: msg of error 
         * }
         */
    }
}

export const getAllSlugs: RequestHandler = async (req, res, next) => {
    try {
        const blogsSlugs = await blogPost.find().select("slug").exec()
        const slugs = blogsSlugs.map(post => post.slug)
        //  console.log("session: "+window.sessionStorage)

        res.status(200).json(slugs)

    } catch (error) {
        next(error)
    }
}

export const getPostBySlug: RequestHandler = async (req, res, next) => {
    try {
        const slug = req.params.slug
        const postBySlug = await blogPost.findOne({ slug: slug }).exec()
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
        const postId = new mongoose.Types.ObjectId()
        const imagePath = "/uploads/post-images/" + postId + ".png"

        await sharp(image.buffer)
            .resize(700, 450)
            .toFile("." + imagePath)
        console.log("title: " + title)
        const newPost = await blogPost.create({
            _id: postId,
            slug,
            title,
            summary,
            body,
            imgUrl: env.SERVER_URL + imagePath + "?lastupdated=" + Date.now(),
            author: author._id
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

        const existingSlug = await blogPost.findOne({ slug }).exec()

        if (existingSlug) {
            throw createHttpError(409, "Slug already taken. Please choose a different one.");
        }

        const postToEdit = await blogPost.findById(postId).exec()
        if (!postToEdit) {
            throw createHttpError(404);
        }
        if (!postToEdit.author.equals(authenticatedUser._id)) {
            throw createHttpError(401);
        }

        if (postImage) {
            imagePath = "/uploads/post-images/" + postId + ".png"

            await sharp(postImage.buffer)
                .resize(700, 450)
                .toFile("." + imagePath)
        }

        const updatedPost = await blogPost.findByIdAndUpdate(postId,
            {
                $set: {
                    ...(slug && { slug }),
                    ...(title && { title }),
                    ...(body && { body }),
                    ...(summary && { summary }),
                    ...(postImage && { imgUrl: env.SERVER_URL + imagePath + "?lastupdated=" + Date.now() }),
                }
            },
            { new: true }).exec()

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

        const postToDelete = await blogPost.findById(postId).exec()
        if (!postToDelete) {
            throw createHttpError(404)
        }
        if (!postToDelete.author.equals(authenticatedUserId)) {
            throw createHttpError(401)
        }
        if (postToDelete.imgUrl.startsWith(env.SERVER_URL)) {
            const imgPathToDelete = postToDelete.imgUrl.split(env.SERVER_URL)[1].split("?")[0]
            console.log(imgPathToDelete);
            fs.unlinkSync("." + imgPathToDelete)
        }

        await postToDelete.deleteOne()
        res.status(200).json({ "message": "success deleted" })

    } catch (error) {
        next(error)
    }
}