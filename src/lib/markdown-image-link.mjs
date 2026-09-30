/**
 * 把 Markdown 正文里的图片包一层链接，指回它自己的原图地址 —— 点一下就能看大图。
 *
 * 不引 lightbox 库，是为了让站点保持**零客户端 JavaScript**：
 * 链接在构建期生成，浏览器原生行为就够了，没有脚本、没有额外请求。
 *
 * ⚠️ 这是 **Sätteri** 插件，不是 rehype 插件。
 * Astro 7 换掉了默认的 Markdown 处理器（从 unified 换成 Sätteri），
 * 旧写法 `markdown.rehypePlugins` 现在会直接报错要求你安装
 * `@astrojs/markdown-remark` —— 那等于把整条管线换回旧的，
 * 为一个小功能不值得。这里用 Sätteri 原生的 `hastPlugins`：
 *   - `filter` 交给 Rust 侧按标签名过滤，只有 <img> 会跨到 JS 这边
 *   - `ctx.wrapNode()` 负责把它包进新元素，不用自己改树
 */
export default {
  name: 'markdown-image-link',
  element: {
    filter: ['img'],
    visit(node, ctx) {
      const src = node.properties?.src;
      if (typeof src !== 'string' || src === '') return;

      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'a',
        properties: {
          href: src,
          class: 'img-link',
          // 新标签页打开：看大图不会把读者从项目页上带走
          target: '_blank',
          rel: 'noopener',
        },
        children: [],
      });
    },
  },
};
