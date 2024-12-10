import express from "express"
import passport from "passport"
import * as userController from "../controller/user"
import { requireAuth } from "../middlewares/requireAuth";
import validatRequestSchema from "../middlewares/validatRequestSchema";
import { emailVerificationSchema, resetPasswordSchema, signUpSchema, updateUserSchema } from "../validation/user";
import { uploadImage } from "../middlewares/UploadImage";
import env from "../env";
import setSessionReturnTo from "../middlewares/setSessionReturnTo";
import validateRequestSchema from "../middlewares/validatRequestSchema";
import { loginRateLimit, requesVerificationCodeRateLimit } from "../middlewares/rateLimit";

const router = express.Router()

router.post('/login', loginRateLimit, passport.authenticate('local'),
    function (req, res) {
        res.status(200).json(req.user)
    });

router.get("/login/google", setSessionReturnTo, passport.authenticate("google"))
router.get("/oauth2/redirect/google", passport.authenticate("google", {
    successReturnToOrRedirect: env.WEBSITE_URL, //fallback when `returnTo` doesn't exsist
    keepSessionInfo: true
}))

router.get("/login/github", setSessionReturnTo, passport.authenticate("github"))
router.get("/oauth2/redirect/github", passport.authenticate("github", {
    successReturnToOrRedirect: env.WEBSITE_URL, //fallback when `returnTo` doesn't exsist
    keepSessionInfo: true
}))
router.post("/signup", validatRequestSchema(signUpSchema), userController.signup)
router.post("/verification-code", requesVerificationCodeRateLimit, validateRequestSchema(emailVerificationSchema), userController.requestEmailVerificationCode);
router.post("/reset-password-code", requesVerificationCodeRateLimit, validateRequestSchema(emailVerificationSchema), userController.requestResetPasswordCode);
router.post("/reset-password", validateRequestSchema(resetPasswordSchema), userController.resetPassword);

router.get("/me", requireAuth, userController.getAuthenticatedUser)
router.patch("/editProfile", requireAuth, uploadImage.single("profileImage"), validatRequestSchema(updateUserSchema), userController.updateUser)
router.get("/profile/:username", userController.getUserByUsername)

router.post("/logout", userController.logout)

export default router;