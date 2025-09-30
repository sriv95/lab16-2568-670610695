import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { Enrollment, CustomRequest, UserPayload, Student } from "../libs/types.js";

// import database
import { enrollments, reset_enrollments, students } from "../db/db.js";
import { success } from "zod";
import { zStudentId } from "../libs/zodValidators.js"
import { authenticateToken } from "../middlewares/authenMiddleware.js";
import { checkRoleAdmin } from "../middlewares/checkRoleAdminMiddleware.js";
import { checkRoles } from "../middlewares/checkRolesMiddleware.js"

const router = Router();

// GET all enrollments
router.get(
    "/",
    authenticateToken, // verify token and extract "user payload"
    checkRoleAdmin, // check User exists and ADMIN role
    (req: Request, res: Response) => {
        try {
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

// GET student enrollments by admin or student
router.get(
    "/:studenId",
    authenticateToken, // verify token and extract "user payload"
    checkRoles, // check User exists and ADMIN role
    (req: Request, res: Response) => {
        try {
            const payload = (req as CustomRequest).user;
            const studentId = req.params.studenId;
            const parseResult = zStudentId.safeParse(studentId);
            if (!parseResult.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parseResult.error.issues[0]?.message,
                });
            }

            const foundIndex = students.findIndex(
                (enr: Student) => enr.studentId === studentId
            );
            if (foundIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Student does not exists",
                });
            }

            if (payload?.role === "STUDENT" && payload?.studentId !== studentId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden access",
                });
            }

            return res.json({
                success: true,
                message: "Student Information",
                data: students[foundIndex],
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

// POST reset
router.post(
    "/reset",
    authenticateToken, // verify token and extract "user payload"
    checkRoleAdmin, // check User exists and ADMIN role
    (req: Request, res: Response) => {
        try {
            // reset all users
            reset_enrollments();
            return res.json({
                success: true,
                message: "enrollments database has been reset"
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