import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// import database
import { enrollments, reset_enrollments } from "../db/db.js";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";

const router = Router();

// GET all enrollments
router.get(
    "/",
    authenticateToken, // verify token and extract "user payload"
    checkRoleAdmin, // check User exists and ADMIN role
    (req: Request, res: Response) => {
        try {
            // return all users
            return res.json({
                success: true,
                data: enrollments,
            });
        } catch (err) {
            return res.status(200).json({
                success: false,
                message: "Something is wrong, please try again",
                error: err,
            });
        }
    }
);



export default router