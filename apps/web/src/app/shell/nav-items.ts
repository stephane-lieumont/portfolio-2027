export interface NavItem {
  readonly path: string;
  readonly label: string;
}

// Contact and the CV are in this list at every viewport width. On the current
// site they are display:none below 1200px and absent from the burger, which
// makes contact unreachable from the navigation on mobile — the worst
// regression the audit found on a site whose purpose is to be contacted.
export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', label: 'Accueil' },
  { path: '/developpeur', label: 'Développeur' },
  { path: '/graphisme-3d', label: 'Graphisme 3D' },
  { path: '/contact', label: 'Contact' },
];
