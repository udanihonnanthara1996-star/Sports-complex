import React, { useEffect, useState, useMemo } from "react";
import API from "../../utils/api";
import AdminNav from "../Admin/AdminNav";
import { FaMoneyBillWave, FaSearch, FaCheckCircle, FaClock, FaEdit, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import "./DetailsPayment.css";

const URL = "/api/v1/payments";

function DetailsPayment() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [editErrors, setEditErrors] = useState({});

  // New states for search, filter, sort, pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("Latest"); // Latest or Oldest
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const res = await API.get(URL);
      let serverUsers = [];
      if (res.data.users && Array.isArray(res.data.users)) serverUsers = res.data.users;
      else if (Array.isArray(res.data)) serverUsers = res.data;

      const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");

      const merged = [...local, ...serverUsers].reduce((acc, curr) => {
        const exists = acc.find(u => u._id === curr._id || u.email === curr.email);
        if (!exists) acc.push(curr);
        return acc;
      }, []);

      // Ensure every user has a created date for sorting
      merged.forEach(u => {
        if (!u.createdAt) {
          u.createdAt = new Date().toISOString(); // Mock date if none exists
        }
      });

      setUsers(merged);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message || "Failed to fetch users.");
      try {
        const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        setUsers(local);
      } catch (e) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;

    if (!user._id) {
      const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
      const updated = local.filter(u => u.email !== user.email);
      localStorage.setItem("submittedUsers", JSON.stringify(updated));
      setUsers(updated);
      return;
    }

    try {
      await API.delete(`${URL}/${user._id}`);
      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user: " + err.message);
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id || user.email);
    setEditValues({
      name: user.name || "",
      email: user.email || "",
      method: user.method || "",
      sport: user.sport || "",
      sportTime: user.sportTime || "",
      amount: user.amount || "",
      phone: user.phone || "",
    });
    setEditErrors({});
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
    setEditErrors({});
  };

  const validateEdit = (vals) => {
    const errs = {};
    if (!vals.name.trim()) errs.name = "Required";
    if (!vals.email.trim()) errs.email = "Required";
    else if (!/^\S+@\S+\.\S+$/.test(vals.email)) errs.email = "Invalid";
    if (!vals.method) errs.method = "Required";
    if (!vals.sport) errs.sport = "Required";
    if (!vals.sportTime) errs.sportTime = "Required";
    if (!vals.amount.toString().trim()) errs.amount = "Required";
    if (!vals.phone.trim()) errs.phone = "Required";
    else if (!/^\d{10}$/.test(vals.phone)) errs.phone = "Invalid (10 digits)";
    return errs;
  };

  const saveEdit = async (id) => {
    const errs = validateEdit(editValues);
    if (Object.keys(errs).length > 0) {
      setEditErrors(errs);
      return;
    }

    try {
      if (!id || id.includes("@")) {
        const local = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        const updated = local.map(u => u.email === editValues.email ? { ...u, ...editValues } : u);
        localStorage.setItem("submittedUsers", JSON.stringify(updated));
        setUsers(updated);
        setEditingId(null);
        return;
      }

      await API.put(`${URL}/${id}`, editValues);
      setEditingId(null);
      fetchUsers();
    } catch (err) {
      console.error("Error saving user:", err);
      alert("Failed to save user: " + err.message);
    }
  };

  const getStatus = (user) => {
    if (user.status) return user.status;
    return user.method ? "Paid" : "Pending";
  };

  const processedUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        (u.name && u.name.toLowerCase().includes(q)) || 
        (u.email && u.email.toLowerCase().includes(q))
      );
    }

    if (filterStatus !== "All") {
      result = result.filter(u => getStatus(u) === filterStatus);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === "Latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [users, searchQuery, filterStatus, sortOrder]);

  const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
  const currentUsers = processedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <AdminNav />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaMoneyBillWave className="text-blue-600 text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 outline-none transition-shadow"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="Latest">Latest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            {loading ? (
              <div className="p-12 flex justify-center items-center gap-3 text-gray-500">
                <FaClock className="animate-spin text-blue-500 text-xl" />
                <span>Loading payments...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 bg-red-50">Error: {error}</div>
            ) : processedUsers.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-5 rounded-full mb-4">
                  <FaMoneyBillWave className="text-gray-400 text-4xl" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">No payments found</h3>
                <p className="text-gray-500">Try adjusting your search or filters to find what you're looking for.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                        <th className="p-5 font-semibold">Customer</th>
                        <th className="p-5 font-semibold">Sport & Time</th>
                        <th className="p-5 font-semibold">Amount (LKR)</th>
                        <th className="p-5 font-semibold">Status</th>
                        <th className="p-5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentUsers.map((user) => {
                        const key = user._id || user.email;
                        const status = getStatus(user);
                        const isEditing = editingId === key;

                        if (isEditing) {
                          return (
                            <tr key={key} className="bg-blue-50/50">
                              <td colSpan="5" className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-xl shadow-sm border border-blue-100">
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Name</label>
                                    <input className={`w-full p-2.5 border rounded-lg ${editErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`} value={editValues.name} onChange={(e) => setEditValues({...editValues, name: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                                    <input className={`w-full p-2.5 border rounded-lg ${editErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`} value={editValues.email} onChange={(e) => setEditValues({...editValues, email: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone</label>
                                    <input className={`w-full p-2.5 border rounded-lg ${editErrors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`} value={editValues.phone} onChange={(e) => setEditValues({...editValues, phone: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Amount</label>
                                    <input className={`w-full p-2.5 border rounded-lg ${editErrors.amount ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all`} value={editValues.amount} onChange={(e) => setEditValues({...editValues, amount: e.target.value})} />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Sport</label>
                                    <select className={`w-full p-2.5 border rounded-lg ${editErrors.sport ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all bg-white`} value={editValues.sport} onChange={(e) => setEditValues({...editValues, sport: e.target.value})}>
                                      <option value="Badminton">Badminton</option>
                                      <option value="Cricket">Cricket</option>
                                      <option value="Table Tennis">Table Tennis</option>
                                      <option value="Basketball">Basketball</option>
                                      <option value="Volleyball">Volleyball</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Sport Time</label>
                                    <select className={`w-full p-2.5 border rounded-lg ${editErrors.sportTime ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all bg-white`} value={editValues.sportTime} onChange={(e) => setEditValues({...editValues, sportTime: e.target.value})}>
                                      <option value="8.00 - 9.00 AM">8.00 - 9.00 AM</option>
                                      <option value="9.00 - 10.00 AM">9.00 - 10.00 AM</option>
                                      <option value="10.00 - 11.00 AM">10.00 - 11.00 AM</option>
                                      <option value="5.00 - 6.00 PM">5.00 - 6.00 PM</option>
                                      <option value="6.00 - 7.00 PM">6.00 - 7.00 PM</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Method</label>
                                    <select className={`w-full p-2.5 border rounded-lg ${editErrors.method ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'} focus:ring-2 outline-none transition-all bg-white`} value={editValues.method} onChange={(e) => setEditValues({...editValues, method: e.target.value})}>
                                      <option value="Credit Card">Credit Card</option>
                                      <option value="Master Card">Master Card</option>
                                      <option value="Cash">Cash</option>
                                    </select>
                                  </div>
                                  <div className="flex items-end justify-end gap-3 h-full pt-2">
                                    <button onClick={cancelEdit} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-lg transition-colors font-medium">
                                      <FaTimes /> Cancel
                                    </button>
                                    <button onClick={() => saveEdit(key)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-colors font-medium shadow-sm">
                                      <FaSave /> Save
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return (
                          <tr key={key} className="hover:bg-gray-50 transition-colors even:bg-gray-50/30 group">
                            <td className="p-5">
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{user.email}</div>
                              <div className="text-xs text-gray-400 mt-1">{user.phone}</div>
                            </td>
                            <td className="p-5">
                              <div className="font-medium text-gray-800">{user.sport}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{user.sportTime}</div>
                            </td>
                            <td className="p-5">
                              <div className="font-bold text-green-600 text-lg tracking-tight">
                                {user.amount ? `Rs. ${user.amount}` : "N/A"}
                              </div>
                              <div className="text-xs text-gray-400 font-medium mt-0.5">{user.method}</div>
                            </td>
                            <td className="p-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                                status === "Paid" ? "bg-green-100 text-green-700 border border-green-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              }`}>
                                {status === "Paid" ? <FaCheckCircle className="text-[14px]" /> : <FaClock className="text-[14px]" />}
                                {status}
                              </span>
                            </td>
                            <td className="p-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEdit(user)} className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Edit">
                                  <FaEdit />
                                </button>
                                <button onClick={() => handleDelete(user)} className="p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors" title="Delete">
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Card View */}
                <div className="lg:hidden p-4 space-y-4 bg-gray-50/50">
                  {currentUsers.map((user) => {
                    const key = user._id || user.email;
                    const status = getStatus(user);
                    const isEditing = editingId === key;

                    if (isEditing) {
                      return (
                        <div key={key} className="bg-white border border-blue-200 p-5 rounded-xl shadow-sm space-y-4">
                           <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1.5">Name</label>
                              <input className={`w-full p-2.5 border rounded-lg ${editErrors.name ? 'border-red-500' : 'border-gray-300'} bg-gray-50`} value={editValues.name} onChange={(e) => setEditValues({...editValues, name: e.target.value})} />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-600 block mb-1.5">Email</label>
                              <input className={`w-full p-2.5 border rounded-lg ${editErrors.email ? 'border-red-500' : 'border-gray-300'} bg-gray-50`} value={editValues.email} onChange={(e) => setEditValues({...editValues, email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1.5">Amount</label>
                                <input className={`w-full p-2.5 border rounded-lg ${editErrors.amount ? 'border-red-500' : 'border-gray-300'} bg-gray-50`} value={editValues.amount} onChange={(e) => setEditValues({...editValues, amount: e.target.value})} />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1.5">Phone</label>
                                <input className={`w-full p-2.5 border rounded-lg ${editErrors.phone ? 'border-red-500' : 'border-gray-300'} bg-gray-50`} value={editValues.phone} onChange={(e) => setEditValues({...editValues, phone: e.target.value})} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Sport</label>
                                  <select className="w-full p-2.5 border rounded-lg border-gray-300 bg-gray-50" value={editValues.sport} onChange={(e) => setEditValues({...editValues, sport: e.target.value})}>
                                    <option value="Badminton">Badminton</option>
                                    <option value="Cricket">Cricket</option>
                                    <option value="Table Tennis">Table Tennis</option>
                                    <option value="Basketball">Basketball</option>
                                    <option value="Volleyball">Volleyball</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Method</label>
                                  <select className="w-full p-2.5 border rounded-lg border-gray-300 bg-gray-50" value={editValues.method} onChange={(e) => setEditValues({...editValues, method: e.target.value})}>
                                      <option value="Credit Card">Credit Card</option>
                                      <option value="Master Card">Master Card</option>
                                      <option value="Cash">Cash</option>
                                  </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3">
                              <button onClick={cancelEdit} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 hover:bg-gray-200 transition-colors">
                                <FaTimes /> Cancel
                              </button>
                              <button onClick={() => saveEdit(key)} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 shadow-sm hover:bg-blue-700 transition-colors">
                                <FaSave /> Save
                              </button>
                            </div>
                        </div>
                      );
                    }

                    return (
                      <div key={key} className="bg-white border border-gray-100 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                status === "Paid" ? "bg-green-100 text-green-700 border border-green-200" : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              }`}>
                            {status === "Paid" ? <FaCheckCircle className="text-[12px]" /> : <FaClock className="text-[12px]" />}
                            {status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-5 text-sm bg-gray-50 p-4 rounded-lg">
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Sport</p>
                            <p className="font-semibold text-gray-800">{user.sport}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Time</p>
                            <p className="font-semibold text-gray-800">{user.sportTime}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Amount</p>
                            <p className="font-bold text-green-600 text-base">Rs. {user.amount}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs mb-0.5">Method</p>
                            <p className="font-semibold text-gray-800">{user.method || "N/A"}</p>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                          <button onClick={() => startEdit(user)} className="px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 font-medium">
                            <FaEdit /> Edit
                          </button>
                          <button onClick={() => handleDelete(user)} className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-2 font-medium">
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white p-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                    <span className="text-sm text-gray-500">
                      Showing <span className="font-semibold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(currentPage * itemsPerPage, processedUsers.length)}</span> of <span className="font-semibold text-gray-900">{processedUsers.length}</span> results
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Previous
                      </button>
                      
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
                              currentPage === idx + 1 
                                ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-200" 
                                : "text-gray-600 hover:bg-gray-100 font-medium"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DetailsPayment;
