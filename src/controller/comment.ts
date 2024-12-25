import { RequestHandler } from "express";
import { CreateCommentBody, CreateCommentParams, DeleteCommentParams, GetCommentRepliesParams, GetCommentsParams, GetCommentsQuery, UpdateCommentBody, UpdateCommentParams } from "../validation/comment";
import CommentModel from "../database/models/comment";
import assertIsDefined from "../utils/assertIsDefined";
import createHttpError from "http-errors";
import { Op } from "sequelize";
import UserModel from "../database/models/user";

export const getCommentsForPosts: RequestHandler<GetCommentsParams, unknown, unknown, GetCommentsQuery> = async (req, res, next) => {
    try {
        const { blogPostId } = req.params
        const { continueAfterId } = req.query
        const pageSize = 50

        const result = await CommentModel
            .findAll({
                where: {
                    ...(continueAfterId && { _id: { [Op.lt]: continueAfterId } }),
                    blogPostId, parentCommentId: null
                },
                order: [['_id', 'DESC']], // Sort by id descending
                limit: pageSize + 1,

            })
        const comments = result.slice(0, pageSize)
        const endOfPaginationReach = result.length <= pageSize

        res.status(200).json({
            comments,
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
        const pageSize = 50

        const result = await CommentModel.findAll({
            where: {
                parentCommentId,
                ...(continueAfterId && { _id: { [Op.gt]: continueAfterId } }),
            },
            order: [['_id', 'ASC']],
            limit: pageSize + 1,
        })

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
            authorId: userId,
        })

        await newComment.reload({
            include: [UserModel]
        })

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

        const commentToUpdate = await CommentModel.findByPk(commentId)
        if (!commentToUpdate) {
            throw createHttpError(404, "comment not found")
        }
        if (commentToUpdate.authorId !== userId) {
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

        const commentToDelete = await CommentModel.findByPk(commentId)

        if (!commentToDelete) {
            throw createHttpError(404, "comment not found")
        }
        if (commentToDelete.authorId !== userId) {
            throw createHttpError(401, "unathuorized")
        }

        await commentToDelete.destroy()
        await CommentModel.destroy({ where: { parentCommentId: commentId } })

        res.sendStatus(200)

    } catch (error) {
        next(error)
    }
}

