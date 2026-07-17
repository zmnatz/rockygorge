import { remark } from "remark";
import remarkHtml from "remark-html";

export async function markdownToHtml(md: string): Promise<string> {
  return (await remark().use(remarkHtml).process(md)).toString();
}
