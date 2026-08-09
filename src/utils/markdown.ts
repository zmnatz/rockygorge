import type React from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { remark } from "remark";
import remarkHtml from "remark-html";
import remarkRehype from "remark-rehype";
import rehypeReact from "rehype-react";
import { mdxComponents } from "@/utils/mdx";

export async function markdownToHtml(md: string): Promise<string> {
  return (await remark().use(remarkHtml).process(md)).toString();
}

export function markdownToReact(md: string): React.ReactNode {
  return remark()
    .use(remarkRehype)
    .use(rehypeReact, {
      jsx,
      jsxs,
      Fragment,
      components: mdxComponents,
    })
    .processSync(md).result;
}
