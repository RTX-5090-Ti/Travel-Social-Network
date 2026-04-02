export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user?.role) {
      res.status(403);
      return next(new Error("Forbidden"));
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error("Forbidden"));
    }
    next();
  };
}
