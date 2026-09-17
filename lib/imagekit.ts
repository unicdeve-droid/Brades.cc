import ImageKit from "imagekit";

let client: ImageKit | null = null;

export function getImageKit() {
  if (!client) {
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error(
        "Variáveis do ImageKit ausentes (IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT)."
      );
    }
    client = new ImageKit({ publicKey, privateKey, urlEndpoint });
  }
  return client;
}
