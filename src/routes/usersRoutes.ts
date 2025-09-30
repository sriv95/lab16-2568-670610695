import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { User, CustomRequest, UserPayload } from "../libs/types.js";

// import database
import { users, reset_users, students } from "../db/db.js";
import { success } from "zod";
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";

const router = Router();

// GET /api/v2/users
router.get(
    "/",
    authenticateToken, // verify token and extract "user payload"
    checkRoleAdmin, // check User exists and ADMIN role
    (req: Request, res: Response) => {
        try {
            // return all users
            return res.json({
                success: true,
                data: users,
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

// POST /api/v2/users/login
router.post("/login", (req: Request, res: Response) => {
    // 1. get username and password from body
    try {
        const { username, password } = req.body;

        const user = users.find(
            (u: User) => u.username === username
                && u.password === password
        )
        // 2. check if user exists (search with username & password in DB)
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password"
            })
        }
        // 3. create JWT token (with user info object as payload) using JWT_SECRET_KEY
        //    (optional: save the token as part of User data)
        const jwt_secret = process.env.JWT_SECRET || "forgot_secret"
        const token = jwt.sign({
            username: user.username,
            role: user.role,
            studentId: user.studentId,
        }, jwt_secret, { expiresIn: "2hr" });
        // 4. send HTTP response with JWT token
        res.status(200).json({
            success: true,
            message: "Login successful",
            token
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong.",
            error: err
        })
    }
});

// POST /api/v2/users/logout
router.post("/logout", (req: Request, res: Response) => {
    // 1. check Request if "authorization" header exists
    //    and container "Bearer ...JWT-Token..."

    // 2. extract the "...JWT-Token..." if available

    // 3. verify token using JWT_SECRET_KEY and get payload (username, studentId and role)

    // 4. check if user exists (search with username)

    // 5. proceed with logout process and return HTTP response
    //    (optional: remove the token from User data)

    return res.status(500).json({
        success: false,
        message: "POST /api/v2/users/logout has not been implemented yet",
    });
});

// POST /api/v2/users/reset
router.post("/reset", (req: Request, res: Response) => {
    try {
        reset_users();
        return res.status(200).json({
            success: true,
            message: "User database has been reset",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Something is wrong, please try again",
            error: err,
        });
    }
});

export default router;