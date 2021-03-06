require("dotenv").config()

const NUM_ITEMS = 50
const MESSAGES_PER_SECOND = 2000

const PORT = process.env.PORT || 7770

export { PORT, NUM_ITEMS, MESSAGES_PER_SECOND }
