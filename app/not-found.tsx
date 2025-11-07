"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className="px-4 py-2 bg-blue-600 text-white rounded inline-block hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  );
}
