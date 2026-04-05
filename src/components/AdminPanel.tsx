import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Users, History, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  id: string;
  username: string;
  balance: number;
  role: string;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  timestamp: any;
}

export default function AdminPanel({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [activeTab, setActiveTab] = useState<'users' | 'transactions' | 'analytics'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      showToast("ইউজার লোড করতে সমস্যা হয়েছে", "error");
    });

    const trxQuery = query(collection(db, 'transactions'));
    const unsubscribeTrx = onSnapshot(trxQuery, (snapshot) => {
      const trxData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(trxData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
      showToast("ট্রানজেকশন লোড করতে সমস্যা হয়েছে", "error");
    });

    return () => {
      unsubscribeUsers();
      unsubscribeTrx();
    };
  }, []);

  const handleUpdateBalance = async (userId: string, amount: number) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { balance: increment(amount) });
      showToast("ব্যালেন্স আপডেট সফল হয়েছে", "success");
    } catch (error) {
      console.error("Error updating balance:", error);
      showToast("ব্যালেন্স আপডেট করতে সমস্যা হয়েছে", "error");
    }
  };

  const analyticsData = users.slice(0, 10).map(u => ({ name: u.username, balance: u.balance }));

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-black italic mb-8">অ্যাডমিন প্যানেল</h1>
      
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'users' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Users size={20} /> ইউজার ম্যানেজমেন্ট
        </button>
        <button onClick={() => setActiveTab('transactions')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'transactions' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <History size={20} /> ট্রানজেকশন হিস্ট্রি
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-yellow-500 text-black' : 'bg-gray-800'}`}>
          <Activity size={20} /> প্লেয়ার অ্যানালিটিক্স
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">ইউজার তালিকা</h2>
          <div className="space-y-4">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between bg-gray-800 p-4 rounded-xl">
                <div>
                  <p className="font-bold">{user.username}</p>
                  <p className="text-sm text-gray-400">ব্যালেন্স: {user.balance}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateBalance(user.id, 100)} className="bg-green-600 px-3 py-1 rounded-lg text-xs font-bold">+100</button>
                  <button onClick={() => handleUpdateBalance(user.id, -100)} className="bg-red-600 px-3 py-1 rounded-lg text-xs font-bold">-100</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">ট্রানজেকশন হিস্ট্রি</h2>
          <div className="space-y-2">
            {transactions.map(trx => (
              <div key={trx.id} className="flex justify-between bg-gray-800 p-3 rounded-lg text-sm">
                <span>ইউজার: {trx.userId}</span>
                <span className={`font-bold ${trx.type === 'deposit' ? 'text-green-400' : 'text-red-400'}`}>
                  {trx.type.toUpperCase()}: {trx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">প্লেয়ার ব্যালেন্স অ্যানালিটিক্স (টপ ১০)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151' }} />
                <Bar dataKey="balance" fill="#EAB308" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
