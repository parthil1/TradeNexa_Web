/** Device payload for register API */
export const REGISTER_DEVICE = {
  device_type: process.env.NEXT_PUBLIC_DEVICE_TYPE || "android",
  device_token: process.env.NEXT_PUBLIC_DEVICE_TOKEN || "firebase_device_token",
};
