import "server-only";
import QRCode from "qrcode";

/** PNG buffer for email CID attachments. */
export async function qrPngBuffer(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, {
    type: "png",
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}
