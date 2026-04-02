export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      },
    );

    if (error) {
      res.status(400);
      return next(new Error(error.details.map((d) => d.message).join(", ")));
    }

    // req.query có thể readonly => KHÔNG gán lại
    req.validated = value; // { body, query, params }
    req.body = value.body ?? req.body; // body vẫn gán ok

    return next();
  };
}
