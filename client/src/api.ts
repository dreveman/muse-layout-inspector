import { createActionClient } from "@hatch/space-sdk/client";
import type { Actions } from "../../server/src/actions";

export const api = createActionClient<typeof Actions>();
export type { ApiRequest, ApiResponse } from "@hatch/space-sdk/client";
