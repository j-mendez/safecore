import { Response } from "express"
import { AppProps } from "@app/types"
import { version } from "../../package.json"

const buildReactTemplateStream = (
  res: Response,
  props: AppProps = {},
  Component?: any
): void => {
  const head = `<!DOCTYPE html>
  <html>
  <head>
	<title>React Realtime${props?.error ? "Error Page" : ""}</title>
  <script>window.__INITIAL__DATA__ = ${JSON.stringify({ props })}</script>
  </head>
  <body>
  <div id="root">`

  res.write(head)
  res.write(Component || `<h1>SafeCore ${version}</h1>`)
  res.write(`</div><script src="/build/app.js"></script></body></html>`)
  res.end()
}

export { buildReactTemplateStream }
