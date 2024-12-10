import { RequestHandler } from "express";
import { CreateCommentBody, CreateCommentParams, DeleteCommentParams, GetCommentRepliesParams, GetCommentsParams, GetCommentsQuery, UpdateCommentBody, UpdateCommentParams } from "../validation/comment";
import CommentModel from "../models/comment";
import assertIsDefined from "../utils/assertIsDefined";
import createHttpError from "http-errors";

export const getCommentsForPosts: RequestHandler<GetCommentsParams, unknown, unknown, GetCommentsQuery> = async (req, res, next) => {
    try {
        const { blogPostId } = req.params
        const { continueAfterId } = req.query
        const pageSize = 50
        const query = CommentModel
            .find({ blogPostId, parentCommentId: undefined })
            .sort({ _id: -1 })

        if (continueAfterId) {
            query.lt("_id", continueAfterId)
        }
        const result = await query
            .limit(pageSize + 1)
            .populate("author")
            .exec()

        const comments = result.slice(0, pageSize)
        const endOfPaginationReach = result.length <= pageSize

        const commentsWithRepliesCount = await Promise.all(
            comments.map(async comment => {
                const repliesCount = await CommentModel.countDocuments({ parentCommentId: comment._id })
                return { ...comment.toObject(), repliesCount } // to add count into comment object
            })
        )

        res.status(200).json({
            comments: commentsWithRepliesCount,
            endOfPaginationReach
        })

    } catch (error) {
        next(error)
    }
}

export const getCommentReplies: RequestHandler<GetCommentRepliesParams, unknown, unknown, GetCommentsQuery> = async (req, res, next) => {
    try {
        const { commentId: parentCommentId } = req.params
        const { continueAfterId } = req.query
        const query = CommentModel.find({ parentCommentId })
        const pageSize = 10
        if (continueAfterId) {
            query.gt("_id", continueAfterId)
        }
        const result = await query
            .limit(pageSize + 1)
            .populate("author")
            .exec()

        const replies = result.slice(0, pageSize)
        const endOfPaginationReach = result.length <= pageSize

        res.status(200).json({
            replies,
            endOfPaginationReach
        })
    } catch (error) {
        next(error)
    }
}

export const createComment: RequestHandler<CreateCommentParams, unknown, CreateCommentBody, unknown> = async (req, res, next) => {
    try {
        const { blogPostId } = req.params
        const { text, parentCommentId } = req.body
        const userId = req.user?._id
        assertIsDefined(userId)

        const newComment = await CommentModel.create({
            blogPostId,
            text,
            parentCommentId,
            author: userId,
        })

        await CommentModel.populate(newComment, { path: "author" })

        res.status(201).json(newComment)
    } catch (error) {
        next(error)
    }
}

export const updateComment: RequestHandler<UpdateCommentParams, unknown, UpdateCommentBody, unknown> = async (req, res, next) => {
    try {
        const { newText } = req.body
        const { commentId } = req.params
        const userId = req.user?._id

        assertIsDefined(userId)

        const commentToUpdate = await CommentModel.findById(commentId).exec()
        if (!commentToUpdate) {
            throw createHttpError(404, "comment not found")
        }
        if (!commentToUpdate.author.equals(userId)) {
            throw createHttpError(401, "unathuorized")
        }

        commentToUpdate.text = newText
        await commentToUpdate.save()

        res.status(200).json(commentToUpdate)

    } catch (error) {
        next(error)
    }
}

export const deleteComment: RequestHandler<DeleteCommentParams, unknown, unknown, unknown> = async (req, res, next) => {
    try {
        const { commentId } = req.params
        const userId = req.user?._id

        assertIsDefined(userId)

        const commentToDelete = await CommentModel.findById(commentId).exec()
        if (!commentToDelete) {
            throw createHttpError(404, "comment not found")
        }
        if (!commentToDelete.author.equals(userId)) {
            throw createHttpError(401, "unathuorized")
        }

        await commentToDelete.deleteOne()
        await CommentModel.deleteMany({parentCommentId: commentId}).exec()

        res.status(200)

    } catch (error) {
        next(error)
    }
}

