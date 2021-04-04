interface User {
  id: number
  value: number
  name: string
}

type AppProps = {
  error?: Error
  data?: User[]
}

export { User, AppProps }
