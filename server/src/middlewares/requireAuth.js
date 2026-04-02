import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      res.status(401);
      throw new Error("Unauthorized");
    }
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { userId, ... }
    next();
  } catch (err) {
    res.status(401);
    next(new Error("Unauthorized"));
  }
}
