import { getDownloadURL, uploadBytes } from "firebase/storage";
import { storage } from "./Firebase";

export const UploadMedia = async (file) => {
  const mediaType = file.type.startWith("video/") ? "video" : "image";
  const path = "posts/" + Date.now() + "_" + file.name;
  const fileRef = ref(storage, path);

  await uploadBytes(fileRef, file);
  const media = await getDownloadURL(fileRef);

  return { media, mediaType };
};
