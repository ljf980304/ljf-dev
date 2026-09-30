import { defineCollection } from 'astro:content';
// Zod 4：`z` 从 `astro/zod` 引入（Astro 6 起 `astro:content` 的 `z` 已废弃），
// 且 URL 校验要用 `z.url()`，旧的 `z.string().url()` 链式写法已废弃。
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * 项目集合。新增一个项目 = 在 src/content/projects/ 下加一个 .md 文件。
 *
 * 文件名一律用 ASCII 英文（glob loader 用它生成 id，也就是 URL 段），
 * 中文标题写在 frontmatter 的 title 里。
 */
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['个人项目', '工作项目']),
    period: z.string().optional(),
    role: z.string().optional(),
    stack: z.array(z.string()),
    highlights: z.array(z.string()).default([]),
    cover: z.string().optional(),
    demo: z.url().optional(),
    // 演示站性质各不相同（有的能真连后端，有的只是静态假数据），
    // 光写「在线预览」会让人误以为都是能用的产品，所以链接文字可覆盖。
    demoLabel: z.string().default('在线预览'),
    repo: z.url().optional(),
    // 首页排序，小的在前；同值时按 title 兜底，避免顺序不确定
    order: z.number().default(0),
    // true 则首页不展示、详情页也不构建。注意：必须在 getStaticPaths 里也过滤，
    // 只过滤首页的话草稿页会被照常构建出来，直接输网址就能访问。
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
