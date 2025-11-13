export type User = {
  user_id: number;
  name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  role: 'user' | 'admin';
};

export type ReportItem = {
  userInitials: string;
  userName: string;
  postDate: string;
  title: string;
  location: string;
  description: string;
}