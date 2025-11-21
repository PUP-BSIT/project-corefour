export type User = {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  role: 'user' | 'admin';
  reports?: Report[];
};

export type NavItem = {
  label: string;
  route: string;
  iconPath: string;
};

export type ProfileNavItem = {
  label: string;
  iconPath: string;
  action: 'navigate' | 'emit' | 'addAccount' | 'logout';
  route?: string;
};
