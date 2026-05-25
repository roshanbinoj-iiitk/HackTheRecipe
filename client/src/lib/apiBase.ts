const envBase = import.meta.env.VITE_API_BASE;
const defaultBase = import.meta.env.PROD ? "" : "http://localhost:8000";

export const API_BASE = (envBase ?? defaultBase).replace(/\/$/, "");
