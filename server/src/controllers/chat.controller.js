import * as chatService from "../services/chat.service.js";

function resolveErrorResponse(res, err) {
  if (err?.status) {
    return res.status(err.status).json({ message: err.message });
  }

  throw err;
}

export async function listConversations(req, res, next) {
  try {
    const payload = await chatService.listConversations({
      userId: req.user.userId,
    });

    res.json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function getConversationMessages(req, res, next) {
  try {
    const payload = await chatService.getConversationMessages({
      userId: req.user.userId,
      conversationId:
        req.validated?.params?.conversationId || req.params.conversationId,
      limit: req.validated?.query?.limit ?? 40,
    });

    res.json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function openDirectConversation(req, res, next) {
  try {
    const payload = await chatService.openDirectConversation({
      viewerId: req.user.userId,
      targetUserId: req.validated?.params?.userId || req.params.userId,
    });

    res.json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function sendMessage(req, res, next) {
  try {
    const payload = await chatService.sendMessage({
      senderId: req.user.userId,
      conversationId:
        req.validated?.params?.conversationId || req.params.conversationId,
      text: req.validated?.body?.text || "",
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function sendImageMessage(req, res, next) {
  try {
    const payload = await chatService.sendImageMessage({
      senderId: req.user.userId,
      conversationId:
        req.validated?.params?.conversationId || req.params.conversationId,
      text: req.validated?.body?.text || "",
      imageFile: req.file,
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function sendGifMessage(req, res, next) {
  try {
    const payload = await chatService.sendGifMessage({
      senderId: req.user.userId,
      conversationId:
        req.validated?.params?.conversationId || req.params.conversationId,
      text: req.validated?.body?.text || "",
      gifUrl: req.validated?.body?.gifUrl || "",
      width: req.validated?.body?.width ?? null,
      height: req.validated?.body?.height ?? null,
    });

    res.status(201).json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function markConversationRead(req, res, next) {
  try {
    const payload = await chatService.markConversationRead({
      userId: req.user.userId,
      conversationId:
        req.validated?.params?.conversationId || req.params.conversationId,
    });

    res.json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}

export async function deleteSelectedConversations(req, res, next) {
  try {
    const payload = await chatService.deleteSelectedConversations({
      userId: req.user.userId,
      conversationIds: req.validated?.body?.conversationIds || [],
    });

    res.json(payload);
  } catch (err) {
    try {
      resolveErrorResponse(res, err);
    } catch (error) {
      next(error);
    }
  }
}
