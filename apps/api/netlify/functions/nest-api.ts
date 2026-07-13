import "reflect-metadata";
import serverlessHttp from "serverless-http";
import { createApp } from "../../src/create-app";

/**
 * Wraps the NestJS API as a single Netlify Function so the full Express
 * app (all controllers, guards, pipes, Swagger) runs unchanged — only the
 * transport differs (serverless-http adapts the Lambda-style event/response
 * shape Netlify Functions use instead of a listening HTTP server).
 *
 * The Nest app is bootstrapped once per warm container and cached across
 * invocations to avoid paying full DI-container startup cost on every
 * request.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedHandler: any;

// Netlify invokes this function at /.netlify/functions/nest-api/*, and the
// event's path includes that full mount prefix — but Nest's own routes are
// registered under just "/api/...". Strip the function's mount prefix so
// Express/Nest see the same clean path regardless of how the function is
// reached.
const FUNCTION_MOUNT_PATH = "/.netlify/functions/nest-api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await createApp();
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    cachedHandler = serverlessHttp(expressApp);
  }

  const strippedPath = event.path.startsWith(FUNCTION_MOUNT_PATH)
    ? event.path.slice(FUNCTION_MOUNT_PATH.length) || "/"
    : event.path;

  return cachedHandler({ ...event, path: strippedPath }, context);
};
