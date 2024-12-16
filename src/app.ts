import "dotenv/config"
import express from "express"
import blogPostRouter from "./router/bolgPost";
import errorHandler from "./middlewares/errorHandler";
import userRouter from "./router/user"
import commentRouter from "./router/comments"
import createHttpError from "http-errors";
/*import session from "express-session";
import sessionConfig from "./config/session";
import passport from "passport";*/
import "./config/passport"

const app = express();
// to allow pass jsonBody to the server 
app.use(express.json())

// login using session
/*app.use(session(sessionConfig))
app.use(passport.authenticate("session"))*/

app.use("/uploads/post-images", express.static("uploads/post-images"))
app.use("/uploads/profile-images", express.static("uploads/profile-images"))

app.use("/posts", blogPostRouter, commentRouter)
app.use("/users", userRouter)

app.use((req, res, next) => next(createHttpError(404, "Endpoint not found")))

app.use(errorHandler)
export default app