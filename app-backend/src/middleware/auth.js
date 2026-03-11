import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  // Check for token in cookies first, then in Authorization header
  let token = req.cookies?.token;
  
  // If no cookie token, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    return res.status(401).json({ message: "Not Logged In" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);

    req.user = { 
      id: decoded.id || decoded.userId,
      email: decoded.email 
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

}

export default authMiddleware;