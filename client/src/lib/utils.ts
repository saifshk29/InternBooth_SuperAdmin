import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number | string): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'long', 
    day: 'numeric', 
    year: 'numeric'
  });
}

export function formatDateTime(date: Date | number | string): string {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTimeAgo(date: Date | number | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}

// Handle Firebase error messages to provide user-friendly error messages
export function handleFirebaseError(error: any): string {
  console.error('Firebase error:', error);
  
  // Check if it's a Firebase error with a code
  if (error.code) {
    switch (error.code) {
      case 'permission-denied':
        return 'You do not have permission to perform this action.';
      case 'not-found':
        return 'The requested resource was not found.';
      case 'already-exists':
        return 'This resource already exists.';
      case 'failed-precondition':
        return 'Operation failed due to a precondition not being met.';
      case 'invalid-argument':
        return 'Invalid argument provided.';
      case 'unauthenticated':
        return 'You must be logged in to perform this action.';
      default:
        return error.message || 'An unknown error occurred.';
    }
  }
  
  // If it's not a Firebase error or doesn't have a code
  return error.message || 'An unknown error occurred.';
}

export function generatePassword(length: number = 10): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    password += chars[randomIndex];
  }
  
  return password;
}

export function getInitials(name: string): string {
  if (!name) return 'NA';
  
  const names = name.split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

export function getRandomColor(): string {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-primary' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-green-100', text: 'text-green-600' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600' },
  ];
  
  return colors[Math.floor(Math.random() * colors.length)].bg;
}

export function getRandomTextColor(): string {
  const colors = [
    'text-primary',
    'text-pink-600',
    'text-green-600',
    'text-yellow-600',
    'text-blue-600',
    'text-purple-600',
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}
