import type { BunPlugin } from "bun"
import path from "path"

const myPlugin: BunPlugin = {
  name: "my-custom-plugin",
  setup(build) {
    build.onResolve({ filter: /base-org*/g, namespace: "file" }, (args) => {
      if (args.path.includes("base-org")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })

    build.onResolve({ filter: /coinbase*/g, namespace: "file" }, (args) => {
      if (args.path.includes("coinbase")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })
    build.onResolve({ filter: /gemini-wallet*/g, namespace: "file" }, (args) => {
      if (args.path.includes("gemini-wallet")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })

    build.onResolve({ filter: /walletconnect*/g, namespace: "file" }, (args) => {
      if (args.path.includes("walletconnect")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })

    build.onResolve({ filter: /metamask*/g, namespace: "file" }, (args) => {
      if (args.path.includes("metamask")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })
    build.onResolve({ filter: /porto/g, namespace: "file" }, (args) => {
      if (args.path.includes("porto")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })

    build.onResolve({ filter: /safe-global/, namespace: "file" }, (args) => {
      if (args.path.includes("safe-global")) {
        return {
          path: path.resolve("./empty-replace/index.js"),
        }
      }
    })
  },
}

export default myPlugin
