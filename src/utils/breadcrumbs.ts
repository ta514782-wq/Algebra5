export interface NavGroupItemLike {
  id: string;
  label: string;
}

export interface NavGroupLike {
  label: string;
  items: NavGroupItemLike[];
}

export interface BreadcrumbSegment {
  id: string;
  label: string;
  targetPage?: string;
  isCurrent: boolean;
  siblingItems?: NavGroupItemLike[];
}

export function buildBreadcrumbTrail({
  activePage,
  navGroups,
  subLabel,
}: {
  activePage: string;
  navGroups: NavGroupLike[];
  subLabel?: string | null;
}): BreadcrumbSegment[] {
  const trimmedSub = subLabel?.trim() || '';

  if (activePage === 'dashboard') {
    return [
      {
        id: 'home',
        label: 'Home',
        targetPage: 'dashboard',
        isCurrent: false,
      },
      {
        id: 'page-dashboard',
        label: 'Dashboard',
        isCurrent: !trimmedSub,
        ...(trimmedSub ? { targetPage: 'dashboard' } : {}),
      },
      ...(trimmedSub
        ? [
            {
              id: 'sub-context',
              label: trimmedSub,
              isCurrent: true,
            },
          ]
        : []),
    ];
  }

  for (const group of navGroups) {
    const found = group.items.find((item) => item.id === activePage);
    if (found) {
      const segments: BreadcrumbSegment[] = [
        {
          id: 'home',
          label: 'Home',
          targetPage: 'dashboard',
          isCurrent: false,
        },
        {
          id: `group-${group.label}`,
          label: group.label,
          siblingItems: group.items,
          isCurrent: false,
        },
        {
          id: `page-${found.id}`,
          label: found.label,
          targetPage: found.id,
          isCurrent: !trimmedSub,
        },
      ];

      if (trimmedSub) {
        segments.push({
          id: 'sub-context',
          label: trimmedSub,
          isCurrent: true,
        });
      }

      return segments;
    }
  }

  return [
    {
      id: 'home',
      label: 'Home',
      targetPage: 'dashboard',
      isCurrent: false,
    },
    {
      id: 'page-dashboard',
      label: 'Dashboard',
      isCurrent: true,
    },
  ];
}
