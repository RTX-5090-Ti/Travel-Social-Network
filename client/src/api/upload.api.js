import { api } from "./axios";

export const uploadApi = {
  uploadTripMedia(formData) {
    return api.post("/api/uploads/trip-media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  cleanupTripMedia(files) {
    return api.delete("/api/uploads/trip-media", {
      data: { files },
    });
  },
};
