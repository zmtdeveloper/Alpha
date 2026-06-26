export function planLimitErrorMessage(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  if (message.includes("workspace project limit reached")) {
    return "Project limit reached for the current plan. Upgrade or remove a project before creating another.";
  }

  if (message.includes("workspace member limit reached")) {
    return "Member limit reached for the current plan. Upgrade or free a seat before inviting another teammate.";
  }

  return null;
}
