const BASE = import.meta.env.BASE_URL || './'

/**
 * 把资源路径转成相对 base 的地址。
 * 项目可能被部署在根路径（/）或子路径（/zhijue/），
 * 素材路径统一写成 `/images/x.jpg`，渲染时再拼上 base。
 */
export function asset(path: string): string {
  if (!path) return path
  if (path.startsWith('data:') || path.startsWith('blob:') || /^(https?:)?\/\//i.test(path)) return path
  const clean = path.replace(/^\.?\//, '')
  return `${BASE.replace(/\/*$/, '')}/${clean}`
}
