import QRCode from 'qrcode'
export async function makeTicketQR(secret: string) {
  return await QRCode.toDataURL(`partyfinder://t/${secret}`)
}
