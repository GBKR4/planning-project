import axios from 'axios';

/**
 * Cloudflare Turnstile server-side verification middleware.
 * Expects `turnstileToken` in req.body.
 */
export const verifyTurnstile = async (req, res, next) => {
    const token = req.body.turnstileToken;

    if (!token) {
        return res.status(400).json({ message: 'Security verification token is required.' });
    }

    try {
        const response = await axios.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            new URLSearchParams({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: token,
                remoteip: req.ip,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        if (!response.data.success) {
            return res.status(400).json({ message: 'Security verification failed. Please try again.' });
        }

        next();
    } catch (err) {
        console.error('Turnstile verification error:', err.message);
        return res.status(500).json({ message: 'Security verification service unavailable.' });
    }
};
