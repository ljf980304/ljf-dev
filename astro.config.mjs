// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // 必须是最终部署的根域名（不带尾斜杠），canonical 和 sitemap 都依赖它。
  // 改这里要重新部署才会生效，所以上线前就定好。
  site: 'https://ljf-dev.com',
});
