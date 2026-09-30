// @ts-check
import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import markdownImageLink from './src/lib/markdown-image-link.mjs';

// https://astro.build/config
export default defineConfig({
  // 必须是最终部署的根域名（不带尾斜杠），canonical 和 sitemap 都依赖它。
  // 改这里要重新部署才会生效，所以上线前就定好。
  site: 'https://ljf-dev.com',

  markdown: {
    // 正文图片自动包一层指向原图的链接 —— 点图看大图，且不需要任何客户端 JS。
    // Astro 7 的默认处理器是 Sätteri，插件挂在它的 hastPlugins 上（不是 rehypePlugins）。
    processor: satteri({ hastPlugins: [markdownImageLink] }),
  },
});
