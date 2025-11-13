export type User = {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  role: 'user' | 'admin';
};
