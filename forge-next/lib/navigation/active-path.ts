export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/coach") {
    return pathname === "/coach";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
