export interface NavItem {
  readonly path: string;
  readonly label: string;
}

/** The header's entries, as on the approved « Bascule » mockup. */
export const NAV = {
  dev: { path: '/developpeur', label: 'Développement' },
  cgi: { path: '/graphisme-3d', label: 'Graphisme 3D' },
  contact: { path: '/contact', label: 'Contact' },
} as const satisfies Record<string, NavItem>;
