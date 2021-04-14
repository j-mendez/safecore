export const parseMessage = (message: string) => {
  return typeof message === "string" ? JSON.parse(message) : message
}
