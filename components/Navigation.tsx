'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/my-timeline', label: 'My Timeline' },
    { href: '/upload-contacts', label: 'Upload Contacts' },
    { href: '/view-chronicle', label: 'View Chronicle' },
  ];

  return (
    <nav className="bg-[#F79B72] border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center h-auto sm:h-16 py-3 sm:py-0">
          <div className="flex items-center mb-3 sm:mb-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Contact Chronicle Logo"
                width={40}
                height={40}
                className="mr-3"
              />
              <span className="text-lg sm:text-xl font-semibold text-[#210F37]">Contact Chronicle</span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1 justify-center sm:justify-end">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base font-bold transition-colors ${
                  pathname === item.href
                    ? 'bg-[#8ABEB9] text-[#210F37]'
                    : 'text-[#210F37] hover:bg-[#B7E5CD] hover:text-[#210F37]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

