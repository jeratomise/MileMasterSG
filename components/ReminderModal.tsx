import React, { useState, useEffect } from 'react';
import { generateEmailDraft } from '../services/geminiService';
import { Bill } from '../types';
import { X, Copy, Mail } from 'lucide-react';

interface ReminderModalProps {
  bills: Bill[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({ bills, isOpen, onClose }) => {
  const [emailContent, setEmailContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      generateEmailDraft(bills).then((text) => {
        setEmailContent(text);
        setLoading(false);
      });
    }
  }, [isOpen, bills]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-600" />
            AI Payment Reminder Draft
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 space-y-4">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500">Drafting email...</p>
                </div>
            ) : (
                <textarea 
                    className="w-full h-64 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    value={emailContent}
                    readOnly
                />
            )}
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Close
            </button>
            <button 
                onClick={() => navigator.clipboard.writeText(emailContent)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
            </button>
        </div>
      </div>
    </div>
  );
};
