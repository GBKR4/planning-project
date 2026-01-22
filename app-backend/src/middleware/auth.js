import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Not Logged In" });
  }


  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { userId: decoded.userId };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

}

export default authMiddleware;