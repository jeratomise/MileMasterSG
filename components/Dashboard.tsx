import React, { useMemo, useState, useEffect } from 'react';
import { Bill, PaymentDetails } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Plus, Filter, TrendingUp, Pencil } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ManualBillModal } from './ManualBillModal';
import { EditBillModal } from './EditBillModal';

interface DashboardProps {
  bills: Bill[];
  onUpdateBill: (bill: Bill) => void;
  onAddBill: (bill: Bill) => void;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const BANK_COLORS: Record<string, string> = {
    'DBS': '#ef4444', // Red
    'Citibank': '#0ea5e9', // Blue
    'UOB': '#0f172a', // Dark Navy
    'HSBC': '#db2777', // Pink
    'OCBC': '#ef4444', // Red
    'Standard Chartered': '#16a34a', // Green
    'AMEX': '#2563eb', // Blue
    'Unknown': '#9ca3af' // Gray
};
const DEFAULT_BANK_COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#f97316'];

export const Dashboard: React.FC<DashboardProps> = ({ bills, onUpdateBill, onAddBill }) => {
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<Bill | null>(null);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('ALL');

  const totalDue = useMemo(() => 
    bills.filter(b => !b.isPaid).reduce((acc, b) => acc + b.totalAmount, 0), 
  [bills]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    bills.forEach(bill => {
      bill.transactions.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    });
    return Object.keys(categories).map(key => ({ name: key, value: categories[key] }));
  }, [bills]);

  // ------------------------------------------------------------------
  // Logic for Clustered Bar Chart (Spend Trend by Bank per Month)
  // ------------------------------------------------------------------
  const { clusteredData, uniqueBanks } = useMemo(() => {
    const monthlyData: Record<string, Record<string, number>> = {};
    const banksSet = new Set<string>();

    bills.forEach(bill => {
        // Use Statement Date for spend allocation, fallback to Due Date
        const dateStr = bill.statementDate || bill.dueDate;
        const dateObj = new Date(dateStr);
        
        // Key format: YYYY-MM for sorting/grouping
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        // Display label: MMM YYYY
        const monthLabel = dateObj.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthLabel, _sortKey: monthKey } as any;
        }

        // Normalize Bank Name (simple cleaning)
        let bankName = bill.bankName.trim();
        if (bankName.toLowerCase().includes('dbs')) bankName = 'DBS';
        else if (bankName.toLowerCase().includes('uob')) bankName = 'UOB';
        else if (bankName.toLowerCase().includes('citi')) bankName = 'Citibank';
        else if (bankName.toLowerCase().includes('hsbc')) bankName = 'HSBC';
        else if (bankName.toLowerCase().includes('ocbc')) bankName = 'OCBC';
        else if (bankName.toLowerCase().includes('american express') || bankName.toLowerCase().includes('amex')) bankName = 'AMEX';

        banksSet.add(bankName);

        // Add amount
        const currentAmount = (monthlyData[monthKey][bankName] as number) || 0;
        monthlyData[monthKey][bankName] = currentAmount + bill.totalAmount;
    });

    // Convert to array and sort by date
    const dataArray = Object.values(monthlyData).sort((a: any, b: any) => 
        a._sortKey.localeCompare(b._sortKey)
    );

    return { clusteredData: dataArray, uniqueBanks: Array.from(banksSet) };
  }, [bills]);

  const upcomingBills = bills
    .filter(b => !b.isPaid)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Extract unique months from bills for filtering list
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    bills.forEach(bill => {
      if (bill.dueDate) {
        const date = new Date(bill.dueDate);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(key);
      }
    });
    return Array.from(months).sort().reverse(); // Newest first
  }, [bills]);

  const filteredBills = useMemo(() => {
    if (selectedMonthFilter === 'ALL') return bills;
    return bills.filter(b => b.dueDate.startsWith(selectedMonthFilter));
  }, [bills, selectedMonthFilter]);

  const handlePaymentConfirm = (billId: string, details: PaymentDetails) => {
    const billToUpdate = bills.find(b => b.id === billId);
    if (billToUpdate) {
        onUpdateBill({
            ...billToUpdate,
            isPaid: true,
            paymentDetails: details
        });
    }
  };

  const handleEditSave = (updatedBill: Bill) => {
      onUpdateBill(updatedBill);
  };

  const formatDateForDisplay = (dateStr: string) => {
     const date = new Date(dateStr);
     return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getMonthLabel = (yyyyMm: string) => {
    const [year, month] = yyyyMm.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-gray-900">${totalDue.toFixed(2)}</h3>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Bills Due Soon</p>
              <h3 className="text-2xl font-bold text-gray-900">{upcomingBills.length}</h3>
            </div>
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Processed Bills</p>
              <h3 className="text-2xl font-bold text-gray-900">{bills.length}</h3>
            </div>
             <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Upcoming List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
          {upcomingBills.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">No upcoming bills. Great job!</p>
          ) : (
            <div className="space-y-3">
              {upcomingBills.map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary/30 transition-colors">
                  <div>
                    <p className="font-medium text-gray-800">{bill.bankName} - {bill.cardName}</p>
                    <p className="text-xs text-gray-500">Due: {bill.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${bill.totalAmount.toFixed(2)}</p>
                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-full">Unpaid</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spend Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-semibold mb-4">Spend by Category</h3>
          {categoryData.length > 0 ? (
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-gray-400">No Data Available</div>
          )}
        </div>
      </div>

      {/* Bank Spend Trend (Clustered Bar Chart) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Spend Trend by Bank
              </h3>
          </div>
          <div className="h-80">
            {clusteredData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                        data={clusteredData} 
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} prefix="$" />
                        <RechartsTooltip 
                            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: '#f3f4f6' }}
                        />
                        <Legend />
                        
                        {uniqueBanks.map((bank, index) => (
                            <Bar 
                                key={bank} 
                                dataKey={bank} 
                                fill={BANK_COLORS[bank] || DEFAULT_BANK_COLORS[index % DEFAULT_BANK_COLORS.length]} 
                                radius={[4, 4, 0, 0]} 
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                    Add bills to see your monthly bank spending comparison.
                </div>
            )}
          </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Table Header with Filters */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Bills</h3>
                  
                  {/* Month Filters */}
                  {availableMonths.length > 0 && (
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg overflow-x-auto">
                        <button
                            onClick={() => setSelectedMonthFilter('ALL')}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                                selectedMonthFilter === 'ALL' 
                                ? 'bg-white text-indigo-600 shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ALL
                        </button>
                        {availableMonths.map(month => (
                            <button
                                key={month}
                                onClick={() => setSelectedMonthFilter(month)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                                    selectedMonthFilter === month 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {getMonthLabel(month)}
                            </button>
                        ))}
                    </div>
                  )}
              </div>
              
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg hover:bg-indigo-100 font-medium transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add Manual Bill
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                      <tr>
                          <th className="px-6 py-4">Bank / Card</th>
                          <th className="px-6 py-4">Due Date</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Payment Info</th>
                          <th className="px-6 py-4">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredBills.length === 0 ? (
                          <tr>
                              <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No bills found for this period.</td>
                          </tr>
                      ) : (
                          filteredBills.map(bill => (
                              <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="font-medium text-gray-900">{bill.cardName}</div>
                                      <div className="text-xs text-gray-400">{bill.bankName}</div>
                                  </td>
                                  <td className="px-6 py-4">{formatDateForDisplay(bill.dueDate)}</td>
                                  <td className="px-6 py-4 font-medium">${bill.totalAmount.toFixed(2)}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          bill.isPaid 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-amber-100 text-amber-700'
                                      }`}>
                                          {bill.isPaid ? 'Paid' : 'Pending'}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs">
                                      {bill.isPaid && bill.paymentDetails ? (
                                          <div>
                                              <p><span className="font-semibold text-gray-700">{bill.paymentDetails.method}</span></p>
                                              <p className="text-gray-400">Ref: {bill.paymentDetails.transactionId}</p>
                                          </div>
                                      ) : (
                                          <span className="text-gray-300">-</span>
                                      )}
                                  </td>
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                          {!bill.isPaid ? (
                                              <button 
                                                  onClick={() => setSelectedBillForPayment(bill)}
                                                  className="text-indigo-600 hover:text-indigo-800 font-medium text-xs bg-indigo-50 px-3 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                                              >
                                                  Mark Paid
                                              </button>
                                          ) : (
                                            <div className="flex flex-col items-start">
                                                <button 
                                                    disabled
                                                    className="text-gray-400 font-medium text-xs cursor-not-allowed bg-gray-100 px-3 py-1 rounded-md"
                                                >
                                                    Settled
                                                </button>
                                                {/* Display Date Below Button */}
                                                {bill.paymentDetails?.paidAt && (
                                                    <span className="text-[10px] text-gray-500 mt-1 ml-1">
                                                        {formatDateForDisplay(bill.paymentDetails.paidAt)}
                                                    </span>
                                                )}
                                            </div>
                                          )}
                                          
                                          <button 
                                            onClick={() => setBillToEdit(bill)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                            title="Edit Bill Details"
                                          >
                                              <Pencil className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      <PaymentModal 
        bill={selectedBillForPayment}
        isOpen={!!selectedBillForPayment}
        onClose={() => setSelectedBillForPayment(null)}
        onConfirm={handlePaymentConfirm}
      />

      <ManualBillModal 
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAdd={onAddBill}
      />

      <EditBillModal 
        bill={billToEdit}
        isOpen={!!billToEdit}
        onClose={() => setBillToEdit(null)}
        onSave={handleEditSave}
      />
    </div>
  );
};