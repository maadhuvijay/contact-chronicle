import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#305669] mb-4">
          Welcome to Contact Chronicle
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Build your personal timeline and track your connections over time. 
          Upload your contacts and visualize your network growth alongside key life events.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/my-timeline"
            className="px-6 py-3 bg-[#8174A0] text-white rounded-md hover:bg-[#6d5f8a] transition-colors font-semibold"
          >
            Build Your Timeline
          </Link>
          <Link
            href="/upload-contacts"
            className="px-6 py-3 bg-[#A888B5] text-white rounded-md hover:bg-[#93759f] transition-colors font-semibold"
          >
            Upload Contacts
          </Link>
          <Link
            href="/view-chronicle"
            className="px-6 py-3 bg-[#EFB6C8] text-white rounded-md hover:bg-[#d9a0b3] transition-colors font-semibold"
          >
            View Chronicle
          </Link>
        </div>
        <div className="mt-12 flex justify-center">
          <Image
            src="/logo.png"
            alt="Contact Chronicle Logo"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
