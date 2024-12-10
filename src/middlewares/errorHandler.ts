import { ErrorRequestHandler } from "express";
import { isHttpError } from "http-errors";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = async (error, req, res, next) => {
    let statusCode = 500
    let errorMessage = "unknown occured error"
    if (isHttpError(error)) {
        statusCode = error.status
        errorMessage = error.message
        console.error(errorMessage)
    }
    res.status(statusCode).json({ error: errorMessage })
}

export default errorHandler