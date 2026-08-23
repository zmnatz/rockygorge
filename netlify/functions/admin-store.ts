import { ADMIN_FILE_PATHS } from "../../src/utils/admin-file-paths";
import { createAdminHandler } from "./admin-handler";

export const config = {
  path: "/api/admin-store",
};

export const handler = createAdminHandler({
  filePath: ADMIN_FILE_PATHS.store,
  branchPrefix: "admin-store",
  label: "store",
});
