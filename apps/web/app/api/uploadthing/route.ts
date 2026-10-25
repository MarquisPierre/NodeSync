import { createRouteHandler } from "uploadthing/next";

import { ourFileRouter } from "./core";

// UploadThing's upload endpoint (/api/uploadthing). Handles uploads for the file
// types defined in core.ts, with debug logging enabled.
export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: { logLevel: "Debug" }
});
