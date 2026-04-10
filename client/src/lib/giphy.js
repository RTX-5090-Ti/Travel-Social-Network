import { GiphyFetch } from "@giphy/js-fetch-api";

const DEFAULT_GIPHY_API_KEY = "1nkeWo3uBJD4LMdiMqEo8aHHkr4Lrxvq";

export const GIPHY_API_KEY =
  import.meta.env.VITE_GIPHY_API_KEY || DEFAULT_GIPHY_API_KEY;

export const giphyFetch = new GiphyFetch(GIPHY_API_KEY);
