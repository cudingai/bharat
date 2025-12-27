
import React, { useState } from 'react';
import { Transaction, Language } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { translations } from '../translations';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete?: (id: string) => void;
  lang?: Language;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onDelete, lang = 'en' }) => {
  const [showImage, setShowImage] = useState(false);
  const t = translations[lang];
  
  const formattedTime = new Date(transaction.timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <>
      <div className="group flex items-center justify-between p-4 mb-3 bg-white rounded-3xl border border-gray-100/80 hover:border-[#4FA3A5]/20 hover:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] transition-all">
        <div className="flex items-center space-x-4">
          <div 
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-[#4FA3A5] bg-[#E8F3F3] group-hover:bg-[#4FA3A5] group-hover:text-white transition-colors"
          >
            <span className="text-lg">
              {CATEGORY_ICONS[transaction.category] || <i className="fas fa-receipt"></i>}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-sm font-outfit tracking-tight">{transaction.merchant}</h4>
            <div className="flex items-center space-x-2 mt-0.5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                {transaction.category} • {formattedTime}
              </p>
              {transaction.receiptImage && (
                <button 
                  onClick={() => setShowImage(true)}
                  className="w-4 h-4 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center hover:bg-teal-100 transition-colors"
                  title={t.viewReceipt}
                >
                  <i className="fa-solid fa-image text-[8px]"></i>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-base font-bold text-gray-800 font-outfit">₹{transaction.amount}</p>
            {transaction.isAutoCaptured && (
              <span className="text-[9px] font-bold text-[#4FA3A5]/60 flex items-center justify-end mt-1 uppercase tracking-tighter">
                <i className="fas fa-magic mr-1 text-[8px]"></i> Auto
              </span>
            )}
          </div>
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <i className="fa-solid fa-trash-can text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {showImage && transaction.receiptImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowImage(false)}
        >
          <button 
            className="absolute top-8 right-8 text-white text-2xl"
            onClick={() => setShowImage(false)}
          >
            <i className="fa-solid fa-times"></i>
          </button>
          <img 
            src={transaction.receiptImage} 
            alt="Receipt" 
            className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain animate-in zoom-in duration-300"
          />
        </div>
      )}
    </>
  );
};

export default TransactionCard;
