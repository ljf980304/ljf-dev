import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * 简历 PDF 由本人手动放进 public/resume.pdf。
 *
 * 用构建期的文件检查决定要不要渲染下载入口 —— 文件不在就不显示按钮，
 * 免得招聘方点到一个 404。
 *
 * ⚠️ 不要改回 `new URL('../../public/resume.pdf', import.meta.url)`。
 * 这个模块在构建时会被 Vite 打包进 `dist/.prerender/chunks/`，
 * 届时 import.meta.url 指向的是产物里的 chunk 而不是源码位置，
 * 相对路径会解析成 `dist/public/resume.pdf` —— **恒不存在的路径**，
 * 于是 hasResume 永远是 false，而且不报任何错。
 *
 * npm 脚本执行时的 cwd 必定是项目根（本地和 Netlify 构建都是），所以用 cwd。
 */
const resumePath = resolve(process.cwd(), 'public', 'resume.pdf');

export const hasResume = existsSync(resumePath);
