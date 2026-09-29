import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * 简历 PDF 由本人手动放进 public/resume.pdf（不提交到仓库也可以，
 * 但那样 Netlify 构建出来的站点就没有这个文件）。
 *
 * 用构建期的文件检查决定要不要渲染下载入口 —— 文件不在就不显示按钮，
 * 免得招聘方点到一个 404。
 */
const resumePath = fileURLToPath(new URL('../../public/resume.pdf', import.meta.url));

export const hasResume = existsSync(resumePath);
