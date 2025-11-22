import React, { useState, useRef } from 'react';
import { extractBillData } from '../services/geminiService';
import { Bill } from '../types';
import { Loader2, Upload, AlertCircle, FileText, CheckCircle } from 'lucide-react';

interface BillUploaderProps {
  onBillProcessed: (bills: Bill[]) => void;
}

export const BillUploader: React.FC<BillUploaderProps> = ({ onBillProcessed }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<Bill[]> => {
     return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            try {
                const base64String = (reader.result as string).split(',')[1];
                const extractedData = await extractBillData(base64String, file.type);
                
                if (!extractedData.bills || extractedData.bills.length === 0) {
                     reject(new Error(`No bills found in ${file.name}`));
                     return;
                }

                const newBills: Bill[] = extractedData.bills.map(billData => ({
                    id: crypto.randomUUID(),
                    bankName: billData.bankName || "Unknown Bank",
                    cardName: billData.cardName || "Unknown Card",
                    statementDate: billData.statementDate || new Date().toISOString().split('T')[0],
                    dueDate: billData.dueDate || new Date().toISOString().split('T')[0],
                    totalAmount: billData.totalAmount,
                    isPaid: false,
                    uploadedAt: new Date().toISOString(),
                    riskScore: 0,
                    transactions: (billData.transactions || []).map((t) => ({
                        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        date: t.date,
                        description: t.description,
                        amount: t.amount,
                        category: t.category,
                        suggestedCard: "Analyzing...",
                    }))
                }));
                resolve(newBills);
            } catch (err: any) {
                reject(new Error(`Failed to parse ${file.name}: ${err.message || "AI extraction failed"}`));
            }
        };
        reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
        reader.readAsDataURL(file);
     });
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsLoading(true);
    setErrors([]);
    setUploadStatus(`Preparing to process ${files.length} file(s)...`);
    
    const allNewBills: Bill[] = [];
    const newErrors: string[] = [];

    // Convert FileList to array
    const fileArray: File[] = Array.from(files);

    try {
        // Process all files concurrently
        const results = await Promise.allSettled(fileArray.map(file => processFile(file)));

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allNewBills.push(...result.value);
            } else {
                newErrors.push((result.reason as any)?.message || "Unknown error occurred");
            }
        });

        if (allNewBills.length > 0) {
            onBillProcessed(allNewBills);
            const successMsg = `Successfully processed ${allNewBills.length} bills from ${fileArray.length - newErrors.length} valid files.`;
            setUploadStatus(successMsg);
        } else {
            setUploadStatus(null);
        }

        if (newErrors.length > 0) {
            setErrors(newErrors);
        }
    } catch (err) {
        setErrors(["An unexpected error occurred during processing."]);
    } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        Upload Bills
      </h2>
      
      <div 
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isLoading ? 'border-primary bg-indigo-50' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
        }`}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-gray-600 font-medium">
                {uploadStatus || "AI is analyzing your statements..."}
            </p>
            <p className="text-xs text-gray-400">Extracting data from multiple files...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 cursor-pointer">
            <div className="bg-indigo-100 p-4 rounded-full">
               <FileText className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-gray-600 font-medium">Click to upload PDF or Images</p>
            <p className="text-xs text-gray-400">Select one or multiple files to process at once</p>
          </div>
        )}
        <input 
            type="file" 
            multiple
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept="image/*,.pdf"
        />
      </div>

      {/* Success Message */}
      {!isLoading && uploadStatus && (
          <div className="mt-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            {uploadStatus}
          </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">
            <div className="flex items-center gap-2 font-medium mb-2">
                <AlertCircle className="w-4 h-4" />
                Errors encountered:
            </div>
            <ul className="list-disc list-inside space-y-1">
                {errors.map((err, i) => (
                    <li key={i} className="text-xs opacity-90">{err}</li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};