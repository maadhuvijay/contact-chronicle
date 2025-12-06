'use client';

import { useState, useRef } from 'react';

interface Contact {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  linkedIn?: string;
  dateAdded?: string;
  dateEdited?: string;
  source?: string;
}

export default function UploadContactsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Contact[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Contact[] => {
    const lines = text.split('\n').filter((line) => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const data: Contact[] = [];

    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const contact: Contact = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header.includes('first') && header.includes('name')) {
          contact.firstName = value;
        } else if (header.includes('last') && header.includes('name')) {
          contact.lastName = value;
        } else if (header.includes('email')) {
          contact.email = value;
        } else if (header.includes('phone')) {
          contact.phone = value;
        } else if (header.includes('linkedin')) {
          contact.linkedIn = value;
        } else if (header.includes('date') && header.includes('added')) {
          contact.dateAdded = value;
        } else if (header.includes('date') && header.includes('edited')) {
          contact.dateEdited = value;
        } else if (header.includes('source')) {
          contact.source = value;
        }
      });
      data.push(contact);
    }

    return data;
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        setPreviewData(parsed);
      };
      reader.readAsText(selectedFile);
    } else {
      alert('Please upload a CSV file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleConfirm = () => {
    console.log('Contacts Data:', previewData);
    alert('Contacts data logged to console. Check browser console for details.');
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#305669] mb-2">
          Upload Contacts
        </h1>
        <p className="text-gray-600">
          Upload your exported contacts (CSV) from LinkedIn, Google, or other sources.
        </p>
      </div>

      <div className="space-y-6">
        {/* Drag and Drop Area */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-[#8ABEB9] bg-[#B7E5CD]'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer block"
            >
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drag and Drop CSV File Here
              </p>
              <p className="text-sm text-gray-500">
                or click to browse
              </p>
            </label>
            {file && (
              <p className="mt-4 text-sm text-[#305669] font-medium">
                Selected: {file.name}
              </p>
            )}
          </div>
        </div>

        {/* Expected Columns Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#305669] mb-4">
            Expected Columns:
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
            <div>• First Name</div>
            <div>• Last Name</div>
            <div>• Email Address</div>
            <div>• Phone Number</div>
            <div>• LinkedIn Profile</div>
            <div>• Date Added</div>
            <div>• Date Edited</div>
            <div>• Source (LinkedIn, Google, etc.)</div>
          </div>
        </div>

        {/* Preview Table */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-[#305669] mb-4">
              Preview Records
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Table View of the Data Uploaded
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-[#456882]">
                <thead>
                  <tr>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">First Name</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Last Name</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Email</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Phone Number</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">LinkedIn Profile</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Date added</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Date Edited</th>
                    <th className="text-left py-2 px-4 font-semibold text-[#305669] text-sm border border-[#456882]">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((contact, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.firstName || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.lastName || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.email || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.phone || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.linkedIn || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.dateAdded || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.dateEdited || '-'}</td>
                      <td className="py-2 px-4 text-sm border border-[#456882]">{contact.source || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleConfirm}
            disabled={previewData.length === 0}
            className="px-6 py-3 bg-[#305669] text-white rounded-md hover:bg-[#244a5a] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm
          </button>
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

