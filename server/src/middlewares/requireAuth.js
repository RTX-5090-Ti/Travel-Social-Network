import User from "../models/User.js";
import { isAccountActive } from "../utils/accountState.js";
import { verifyAccessToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select(
      "_id role isActive scheduledDeletionAt",
    );

    if (!user || !isAccountActive(user)) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    req.user = {
      ...decoded,
      userId: user._id.toString(),
      role: user.role || decoded.role,
    };
    next();
  } catch (err) {
    res.status(401);
    next(new Error("Unauthorized"));
  }
}
