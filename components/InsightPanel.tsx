
import React, { useEffect, useState } from 'react';
import { Bill } from '../types';
import { generateOptimizationAdvice } from '../services/geminiService';
import { Lightbulb, TrendingDown, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface InsightPanelProps {
  bills: Bill[];
}

export const InsightPanel: React.FC<InsightPanelProps> = ({ bills }) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(true);
  const [showAnomalies, setShowAnomalies] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      if (bills.length === 0) return;
      
      // Only analyze mostly recent transactions to save tokens/time
      const recentTransactions = bills
        .flatMap(b => b.transactions || [])
        .slice(0, 15); // Analyze last 15 transactions

      if (recentTransactions.length === 0) return;

      setLoading(true);
      const result = await generateOptimizationAdvice(recentTransactions);
      setAnalysis(result);
      setLoading(false);
    };

    analyze();
  }, [bills]);

  if (bills.length === 0) {
    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl text-white shadow-lg mb-6">
            <h3 className="text-xl font-bold mb-2">Start Tracking</h3>
            <p className="opacity-90">Upload your first bill to get AI-powered miles optimization insights.</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Main Advice */}
      <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl text-white shadow-lg relative overflow-hidden transition-all duration-300">
        <div className="relative z-10">
            <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setShowInsights(!showInsights)}
            >
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-6 h-6 text-yellow-300" />
                    <h3 className="text-xl font-bold">MileMaster AI Insights</h3>
                </div>
                <button className="p-1 rounded-full hover:bg-white/10">
                    {showInsights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
            </div>
            
            {showInsights && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                    {loading ? (
                        <p className="animate-pulse">Analyzing your spend against Milelion strategies...</p>
                    ) : (
                        <>
                            <p className="text-lg leading-relaxed opacity-95 mb-4">{analysis?.advice || "Keep spending to get insights."}</p>
                            <div className="flex gap-4 mt-2">
                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    <span className="block text-xs opacity-70 uppercase tracking-wider">Risk Score</span>
                                    <span className="text-2xl font-bold">{analysis?.riskScore ?? 0}/100</span>
                                </div>
                                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                                    <span className="block text-xs opacity-70 uppercase tracking-wider">Missed Miles</span>
                                    <span className="text-2xl font-bold text-yellow-300">~{analysis?.missedMiles ?? 0}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* Anomalies / Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between overflow-hidden">
         <div 
            className="p-6 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => setShowAnomalies(!showAnomalies)}
         >
            <h4 className="text-gray-900 font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-orange-500" />
                Detected Anomalies
            </h4>
            <button className="text-gray-400">
                {showAnomalies ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
         </div>

         {showAnomalies && (
             <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200 flex-1 flex flex-col justify-between">
                 <div>
                    {loading ? (
                        <div className="h-2 bg-gray-100 rounded animate-pulse w-full mb-2"></div>
                    ) : (
                        <ul className="text-sm text-gray-600 space-y-2">
                            {analysis?.anomalies && analysis.anomalies.length > 0 ? (
                                analysis.anomalies.map((a: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-1.5 shrink-0"></span>
                                        {a}
                                    </li>
                                ))
                            ) : (
                                <li className="text-gray-400 italic">No unusual spending patterns detected.</li>
                            )}
                        </ul>
                    )}
                 </div>
                 
                 <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Strategy Source</p>
                    <p className="text-xs font-medium text-indigo-600">Powered by Milelion Guide Guidelines</p>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
