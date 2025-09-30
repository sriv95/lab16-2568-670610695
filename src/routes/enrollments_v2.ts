import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

import type { Enrollment, CustomRequest, UserPayload, Student } from "../libs/types.js";

// import database
import { enrollments, reset_enrollments, students } from "../db/db.js";
import { success } from "zod";
import { zStudentId, zEnrollmentBody, zCourseId } from "../libs/zodValidators.js"
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
    checkRoles,
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

            return res.status(200).json({
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

// POST student enroll
router.post(
    "/:studenId",
    authenticateToken, // verify token and extract "user payload"
    checkRoles,
    (req: Request, res: Response) => {
        try {
            const body = req.body as Enrollment;
            const bodyParseResult = zEnrollmentBody.safeParse(body);
            if (!bodyParseResult.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: bodyParseResult.error.issues[0]?.message,
                });
            }

            const payload = (req as CustomRequest).user;
            const studentId = req.params.studenId;
            const parseResult = zStudentId.safeParse(studentId);
            if (!parseResult.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parseResult.error.issues[0]?.message,
                });
            }

            if (payload?.role === "ADMIN" && payload?.studentId !== studentId) {
                return res.status(403).json({
                    success: false,
                    message: "Forbidden access",
                });
            }

            const foundIndex = students.findIndex(
                (s: Student) => s.studentId === studentId
            );
            if (foundIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Student does not exists",
                });
            }

            // check if course id exists
            if (students[foundIndex]?.courses?.includes(body.courseId)) {
                return res.status(400).json({
                    success: false,
                    message: "studentId && courseId already exists",
                });
            }

            students[foundIndex]?.courses?.push(body.courseId);

            const enrollement: Enrollment = {
                studentId: String(studentId),
                courseId: body.courseId,
            };
            enrollments.push(enrollement);

            return res.status(201).json({
                success: true,
                message: `Student ${studentId} && Course ${body.courseId} has been added successfully`,
                data: enrollement,
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

// DELETE student enroll
router.delete(
    "/:studenId",
    authenticateToken, // verify token and extract "user payload"
    checkRoles,
    (req: Request, res: Response) => {
        try {
            const body = req.body;
            const payload = (req as CustomRequest).user;
            const studentId = req.params.studenId;
            const parseResult = zStudentId.safeParse(studentId);
            if (!parseResult.success) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: parseResult.error.issues[0]?.message,
                });
            }

            if (payload?.role === "ADMIN" && payload?.studentId !== studentId) {
                return res.status(403).json({
                    success: false,
                    message: "You are not allowed to modify another student's data",
                });
            }

            const foundIndex = enrollments.findIndex(
                (e: Enrollment) => e.studentId === studentId
                    && e.courseId === body.courseId
            );
            if (foundIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Enrollment does not exists",
                });
            }

            // delete in enrollments
            enrollments.splice(foundIndex, 1);

            // delete in students
            const foundIndex2 = students.findIndex(
                (s: Student) => s.studentId === studentId
            );
            if (foundIndex2 === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Student does not exists",
                })
            }
            const foundIndex3 = students[foundIndex2]?.courses?.findIndex(
                (c: string) => c === body.courseId
            ) || -1;
            if (foundIndex3 === -1) {
                return res.status(404).json({
                    success: false,
                    message: "Course does not exists",
                })
            }

            students[foundIndex2]?.courses?.splice(foundIndex3, 1);

            return res.status(200).json({
                success: true,
                message: `Student ${studentId} && Course ${body.courseId} has been deleted successfully`,
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