import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;

/**
 * 取所有已发布的项目，按 order 升序。
 *
 * 过滤 draft 的逻辑只在这里写一次——首页和 `getStaticPaths` 都用它。
 * 如果只有首页过滤，草稿项目虽然不在列表里，但详情页会被照常构建出来，
 * 知道网址的人直接访问就能看到。
 */
export async function getPublishedProjects(): Promise<Project[]> {
  const projects = await getCollection('projects', ({ data }) => !data.draft);
  return projects.sort(
    (a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title),
  );
}

/** 按 category 分组，保持 getPublishedProjects 已经排好的顺序。 */
export function groupByCategory(projects: Project[]): Map<string, Project[]> {
  const groups = new Map<string, Project[]>();
  for (const project of projects) {
    const list = groups.get(project.data.category) ?? [];
    list.push(project);
    groups.set(project.data.category, list);
  }
  return groups;
}
