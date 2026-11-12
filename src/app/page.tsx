import { redirect } from 'next/navigation';

// The guarded /dashboard route sends signed-out visitors on to /login.
export default function Home() {
  redirect('/dashboard');
}
