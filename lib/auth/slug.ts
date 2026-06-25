const slugPattern = /[^a-z0-9]+/g;
const trimDashPattern = /^-+|-+$/g;

export function createSlug(input: string) {
  const slug = input
    .toLowerCase()
    .trim()
    .replace(slugPattern, "-")
    .replace(trimDashPattern, "");

  return slug || "workspace";
}
