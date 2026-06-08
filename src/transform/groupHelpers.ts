function getId(ref: unknown): string {
  if (!ref || typeof ref !== "object") {
    return "";
  }
  return String((ref as { id?: unknown }).id ?? "");
}

function toArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

export function getPrimaryGroupName(groupsById: Map<string, any>, refs: unknown): string {
  const names = toArray(refs)
    .map(getId)
    .filter(Boolean)
    .map((id) => groupsById.get(id)?.name)
    .filter((name): name is string => typeof name === "string" && name.length > 0)
    .sort((a, b) => a.localeCompare(b));

  return names[0] ?? "";
}

export function getPrimaryCompanyGroupName(groupsById: Map<string, any>, refs: unknown): string {
  const candidates = toArray(refs)
    .map(getId)
    .filter(Boolean)
    .map((id) => findCompanyGroupName(groupsById, id))
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b));

  return candidates[0] ?? "";
}

function findCompanyGroupName(groupsById: Map<string, any>, startGroupId: string): string {
  let cursor: string | undefined = startGroupId;
  let safety = 0;

  while (cursor && safety < 100) {
    const node = groupsById.get(cursor);
    if (!node) {
      return "";
    }
    if (cursor === "GroupCompanyId" || cursor === "CompanyGroupId") {
      return typeof node.name === "string" ? node.name : "";
    }

    const parentId = node.parent?.id;
    if (!parentId || typeof parentId !== "string") {
      break;
    }

    cursor = parentId;
    safety += 1;
  }

  return "";
}
