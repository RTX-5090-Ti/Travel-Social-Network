import * as commentService from "../services/comment.service.js";

function handleServiceError(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function createTripComment(req, res, next) {
  try {
    const payload = await commentService.createTripComment({
      userId: req.user.userId,
      tripId: req.validated?.params?.id || req.params.id,
      content: req.validated?.body?.content || "",
      parentCommentId: req.validated?.body?.parentCommentId || "",
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function createTripCommentGif(req, res, next) {
  try {
    const payload = await commentService.createTripCommentGif({
      userId: req.user.userId,
      tripId: req.validated?.params?.id || req.params.id,
      content: req.validated?.body?.content || "",
      gifUrl: req.validated?.body?.gifUrl || "",
      parentCommentId: req.validated?.body?.parentCommentId || "",
      width: req.validated?.body?.width ?? null,
      height: req.validated?.body?.height ?? null,
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function createTripCommentImage(req, res, next) {
  try {
    const payload = await commentService.createTripCommentImage({
      userId: req.user.userId,
      tripId: req.validated?.params?.id || req.params.id,
      content: req.validated?.body?.content || "",
      parentCommentId: req.validated?.body?.parentCommentId || "",
      imageFile: req.file,
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function listTripComments(req, res, next) {
  try {
    const payload = await commentService.listTripComments({
      tripId: req.validated?.params?.id || req.params.id,
      viewerId: req.user.userId,
      limit: req.validated?.query?.limit ?? 20,
      cursor: req.validated?.query?.cursor,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function listCommentReplies(req, res, next) {
  try {
    const payload = await commentService.listCommentReplies({
      commentId: req.validated?.params?.commentId || req.params.commentId,
      viewerId: req.user.userId,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function getCommentContext(req, res, next) {
  try {
    const payload = await commentService.getCommentContext({
      commentId: req.validated?.params?.commentId || req.params.commentId,
      viewerId: req.user.userId,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function updateComment(req, res, next) {
  try {
    const payload = await commentService.updateComment({
      userId: req.user.userId,
      commentId: req.validated?.params?.commentId || req.params.commentId,
      content: req.validated?.body?.content || "",
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function deleteComment(req, res, next) {
  try {
    const payload = await commentService.deleteComment({
      userId: req.user.userId,
      commentId: req.validated?.params?.commentId || req.params.commentId,
    });

    res.json(payload);
  } catch (err) {
    try {
      handleServiceError(res, err);
    } catch (error) {
      next(error);
    }
  }
}
