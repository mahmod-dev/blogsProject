import { rateLimit } from "express-rate-limit"

export const loginRateLimit = rateLimit({
    windowMs: 2 * 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
})

export const requesVerificationCodeRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 1,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true
})

export const createPostRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true
})

export const updatePostRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true
}) 