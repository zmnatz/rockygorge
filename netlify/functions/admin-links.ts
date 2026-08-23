import { ADMIN_FILE_PATHS } from "../../src/utils/admin-file-paths";
import { createAdminHandler } from "./admin-handler";

export const config = {
  path: "/api/admin-links",
};

export const handler = createAdminHandler({
  filePath: ADMIN_FILE_PATHS.links,
  branchPrefix: "admin-links",
  label: "links",
});
