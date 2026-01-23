import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken, generateRefreshToken } from "../utils/jwt.js";
import pool from "../db/pool.js";
import { asyncHandler, AppError } from "../middleware/errorHandler.js";
import crypto from "crypto";
import { sendEmail } from "../services/email/emailService.js";

export const Register = asyncHandler(async (req, res) => {
    const data = req.body;

    //basic validation
    if (!data.name || !data.email || !data.password) {
        return res.status(400).json({ message: "Name, Email and Password required" });
    }

    //email existence
    const exists = await pool.query("SELECT id FROM users WHERE email =$1", [data.email]);

    if (exists.rowCount > 0) {
        return res.status(409).json({ message: "Email already exists" });
    }

    const hashed = await hashPassword(data.password);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    //insert user with verification token
    await pool.query(
        `INSERT INTO users (name, email, password_hash, verification_token_hash, verification_token_expires) 
         VALUES ($1, $2, $3, $4, to_timestamp($5 / 1000.0))`,
        [data.name, data.email, hashed, tokenHash, tokenExpiry]
    );

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
        to: data.email,
        subject: "Verify Your Email",
        text: `Please verify your email by clicking on the following link: ${verificationLink}`,
    });
    
    res.json({ 
        message: "Registration successful! Please check your email to verify your account.",
        email: data.email 
    });
});

export const Login = asyncHandler(async (req, res) => {

    const data = req.body;

    //basic validation
    if (!data.email || !data.password) {
        return res.status(400).json({ message: "Email and Password required" });
    }

    //const find user
    const result = await pool.query(
        "SELECT id, name, email, email_verified, password_hash FROM users WHERE email = $1", [data.email]
    );

    if (result.rowCount === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    const isValid = await comparePassword(data.password, user.password_hash);

    if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate access token
    const token = generateToken({ userId: user.id });

    // Generate refresh token
    const refreshToken = generateRefreshToken({ userId: user.id });
    const refreshTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

    // Store refresh token in database
    await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) 
         VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
        [user.id, refreshTokenHash]
    );

    //SET COOKIES
    res.cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and token
    return res.json({ 
        message: "Login Successful",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            email_verified: user.email_verified
        },
        token 
    });
});

export const Logout = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    // Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    
    // Delete refresh token from database if exists
    if (refreshToken) {
        const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
        await pool.query("DELETE FROM refresh_tokens WHERE token_hash = $1", [tokenHash]);
    }
    
    res.json({ message: "Logout successful" });    
});

export const forgotPassword = asyncHandler(async (req, res) => { 
    const email = req.body.email;

    if(!email){
        return res.status(400).json({ message : "Email is necessary"});
    }

    const result = await pool.query("SELECT id FROM users WHERE email = $1",[email]);

    if(result.rowCount === 0){
        return res.json({ message : "if email exists then reset link has been sent to your email"});
    }

    const userId = result.rows[0].id;

    const resetToken = crypto.randomBytes(32).toString("hex");

    const resetTokenHash = crypto.createHash("sha256")
    .update(resetToken)
    .digest("hex");

    const resetTokenExpiry = Date.now() + 900000; // 15 minutes in milliseconds

    await pool.query(`UPDATE users SET reset_token_hash = $1, reset_token_expires = to_timestamp($2 / 1000.0) WHERE id = $3`,[resetTokenHash,resetTokenExpiry,userId]);

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
        to: email,
        subject: "Password Reset Request",
        text: `You can reset your password by clicking on the following link: ${resetLink}`,
    });

    res.json({ message : "if email exists then reset link has been sent to your email"});
});