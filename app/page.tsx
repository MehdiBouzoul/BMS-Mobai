import { redirect } from 'next/navigation';

/**
 * Root Page
 * Redirects the user to the /dashboard route automatically.
 */
export default function RootPage() {
  redirect('/dashboard');
  
  // This return is technically never reached but required for TS 
  return null;
}