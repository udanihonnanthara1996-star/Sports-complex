import React, { useEffect, useState, useMemo } from "react";
import API from "../../utils/api";
import "./Payment.css";
import Nav from "../Nav/Nav";
import jsPDF from "jspdf";
import { FaMoneyBillWave, FaSearch, FaCheckCircle, FaClock } from "react-icons/fa";

const URL = "/api/v1/payments";

function Payment() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    method: "",
    sport: "",
    sportTime: "",
    amount: "",
    phone: "",
    cardN: "",
  });

  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  // History UI States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("Latest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }
    
    if (!formData.method) {
      newErrors.method = "Payment method is required.";
    }

    const cleanCardN = formData.cardN.replace(/-/g, "");
    if (!formData.cardN.trim()) {
      newErrors.cardN = "Card number is required.";
    } else if (!/^\d{16}$/.test(cleanCardN)) {
      newErrors.cardN = "Card number must be exactly 16 digits.";
    } else if (formData.method === "Master Card" && !/^5[1-5]/.test(cleanCardN) && !/^2[2-7]/.test(cleanCardN)) {
      newErrors.cardN = "Invalid Master Card number. It should start with 51-55 or 22-27.";
    } else if (formData.method === "Credit Card" && !/^4/.test(cleanCardN)) {
      newErrors.cardN = "Invalid Visa Credit Card number. It should start with 4.";
    }

    if (!formData.sport) newErrors.sport = "Sport is required.";
    if (!formData.sportTime) newErrors.sportTime = "Booking time is required.";
    
    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required.";
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be a valid positive number.";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get(URL);
      let fetchedUsers = [];
      if (Array.isArray(res.data)) {
        fetchedUsers = res.data;
      } else if (res.data.users && Array.isArray(res.data.users)) {
        fetchedUsers = res.data.users;
      }
      
      // Ensure mock dates for sorting if missing
      fetchedUsers.forEach(u => {
        if (!u.createdAt) {
          u.createdAt = new Date().toISOString(); 
        }
      });
      setUsers(fetchedUsers);
    } catch (err) {
      console.error("Error fetching users:", err);
      const serverMsg = err.response && (err.response.data && (err.response.data.message || err.response.data.error))
        ? (err.response.data.message || err.response.data.error)
        : null;
      setError(serverMsg || err.message || "Failed to fetch users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorMessage = Object.values(validationErrors).join("\n- ");
      alert("Please fix the following validation errors:\n\n- " + errorMessage);
      return;
    }
    try {
      await API.post(URL, formData);
      setSuccess(true);
      generatePDF();
      
      const submitted = { ...formData };
      try {
        const existing = JSON.parse(localStorage.getItem("submittedUsers") || "[]");
        existing.unshift(submitted);
        localStorage.setItem("submittedUsers", JSON.stringify(existing));
      } catch (e) {
        console.error("localStorage write failed", e);
      }

      setFormData({
        name: "",
        email: "",
        method: "",
        sport: "",
        sportTime: "",
        amount: "",
        phone: "",
        cardN: "",
      });
      setErrors({});
      // Refresh list
      fetchUsers();
    } catch (err) {
      console.error("Error submitting payment:", err);
      alert("Error submitting payment: " + err.message);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Customer Payment Details", 20, 20);

    doc.setFontSize(12);
    doc.text(`Name: ${formData.name}`, 20, 40);
    doc.text(`Email: ${formData.email}`, 20, 50);
    doc.text(`Payment Method: ${formData.method}`, 20, 60);
    doc.text(`Sport: ${formData.sport}`, 20, 70);
    doc.text(`Booking Time: ${formData.sportTime}`, 20, 80);
    doc.text(`Amount: ${formData.amount}`, 20, 90);
    doc.text(`Phone: ${formData.phone}`, 20, 100);

    doc.save("payment-details.pdf");
  };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

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
    <div className="payment-page">
        <Nav />
      <div className="body1 pb-16">
        <div className="payment-container beautiful-form mb-12">
          <h2>
            <span role="img" aria-label="payment" style={{ marginRight: "8px" }}></span>
            Payment Form
          </h2>

          {success && (
            <div className="success-message">
              <span role="img" aria-label="success">✅</span> Payment Successful!
            </div>
          )}

          <button onClick={generatePDF} className="download-pdf-btn">
            <span role="img" aria-label="download" style={{ marginRight: "6px" }}></span>
            Download PDF
          </button>

          <form onSubmit={handleSubmit} className="payment-form grid-form">
            <div className="form-row">
              <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              <input type="text" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required />
            </div>
            {(errors.name || errors.email) && (
              <div className="form-errors">
                {errors.name && <p className="error-text">{errors.name}</p>}
                {errors.email && <p className="error-text">{errors.email}</p>}
              </div>
            )}
            <div className="form-row">
              <select name="method" value={formData.method} onChange={handleChange} required>
                <option value="">-- Select Payment Method --</option>
                <option value="Credit Card">💳 Credit Card</option>
                <option value="Master Card">💳 Master Card</option>
              </select>
              <input type="text" name="cardN" placeholder="Card Number (1111-2222-3333-4444)" value={formData.cardN} onChange={handleChange} required />
            </div>
            {(errors.method || errors.cardN) && (
              <div className="form-errors">
                {errors.method && <p className="error-text">{errors.method}</p>}
                {errors.cardN && <p className="error-text">{errors.cardN}</p>}
              </div>
            )}
            <div className="form-row">
              <select name="sport" value={formData.sport} onChange={handleChange} required>
                <option value="">-- Select Sport --</option>
                <option value="Badminton"> Badminton</option>
                <option value="Cricket"> Cricket</option>
                <option value="Table Tennis"> Table Tennis</option>
                <option value="Basketball"> Basketball</option>
                <option value="volleyball"> Volleyball</option>
              </select>
              <select name="sportTime" value={formData.sportTime} onChange={handleChange} required>
                <option value="">-- Select Booking Time --</option>
                <option value="8.00 - 9.00 AM">8.00 - 9.00 AM</option>
                <option value="9.00 - 10.00 AM">9.00 - 10.00 AM</option>
                <option value="10.00 - 11.00 AM">10.00 - 11.00 AM</option>
                <option value="5.00 - 6.00 PM">5.00 - 6.00 PM</option>
                <option value="6.00 - 7.00 PM">6.00 - 7.00 PM</option>
              </select>
            </div>
            {(errors.sport || errors.sportTime) && (
              <div className="form-errors">
                {errors.sport && <p className="error-text">{errors.sport}</p>}
                {errors.sportTime && <p className="error-text">{errors.sportTime}</p>}
              </div>
            )}
            <div className="form-row">
              <input type="text" name="amount" placeholder="Amount" value={formData.amount} onChange={handleChange} required />
              <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required />
            </div>
            {(errors.amount || errors.phone) && (
              <div className="form-errors">
                {errors.amount && <p className="error-text">{errors.amount}</p>}
                {errors.phone && <p className="error-text">{errors.phone}</p>}
              </div>
            )}
            <button type="submit" className="pay-btn">
              <span role="img" aria-label="pay"></span> Pay Now
            </button>
          </form>
        </div>

        {/* --- Modern Payment History UI --- */}
        <div className="max-w-6xl mx-auto px-4 w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <FaMoneyBillWave className="text-green-600 text-xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Payment History</h1>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-64 outline-none transition-all shadow-sm"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="Latest">Latest First</option>
                <option value="Oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Table/Card Area */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {loading ? (
              <div className="p-12 flex justify-center items-center gap-3 text-gray-500">
                <FaClock className="animate-spin text-green-500 text-xl" />
                <span className="font-medium">Loading payments...</span>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-500 bg-red-50 font-medium">Error: {error}</div>
            ) : processedUsers.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <div className="bg-gray-50 p-5 rounded-full mb-4 border border-gray-100">
                  <FaMoneyBillWave className="text-gray-300 text-4xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No payments found</h3>
                <p className="text-gray-500">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-widest border-b border-gray-200">
                        <th className="p-5 font-bold">Customer Name</th>
                        <th className="p-5 font-bold">Sport & Time</th>
                        <th className="p-5 font-bold">Amount (LKR)</th>
                        <th className="p-5 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentUsers.map((user, index) => {
                        const status = getStatus(user);
                        return (
                          <tr key={user._id || index} className="hover:bg-gray-50/80 transition-colors even:bg-gray-50/40">
                            <td className="p-5">
                              <div className="font-bold text-gray-800 text-base">{user.name || "N/A"}</div>
                              <div className="text-sm text-gray-500 mt-0.5">{user.email || "No email"}</div>
                              <div className="text-xs text-gray-400 mt-1">{user.phone}</div>
                            </td>
                            <td className="p-5">
                              <div className="font-semibold text-gray-700">{user.sport || "N/A"}</div>
                              <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                                <FaClock className="text-gray-400 text-[11px]" />
                                {user.sportTime || "N/A"}
                              </div>
                            </td>
                            <td className="p-5">
                              <div className="font-black text-green-600 text-lg">
                                {user.amount ? `Rs. ${user.amount}` : "N/A"}
                              </div>
                              <div className="text-xs font-semibold text-gray-400 mt-0.5 uppercase tracking-wide">{user.method}</div>
                            </td>
                            <td className="p-5">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                status === "Paid" ? "bg-green-50 text-green-600 border border-green-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                              }`}>
                                {status === "Paid" ? <FaCheckCircle className="text-[14px]" /> : <FaClock className="text-[14px]" />}
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Stacked Card View */}
                <div className="lg:hidden p-4 space-y-4 bg-gray-50/50">
                  {currentUsers.map((user, index) => {
                    const status = getStatus(user);
                    return (
                      <div key={user._id || index} className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{user.name || "N/A"}</h3>
                            <p className="text-sm text-gray-500 mt-1">{user.email || "No email"}</p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                status === "Paid" ? "bg-green-50 text-green-600 border border-green-200" : "bg-yellow-50 text-yellow-600 border border-yellow-200"
                              }`}>
                            {status === "Paid" ? <FaCheckCircle className="text-[12px]" /> : <FaClock className="text-[12px]" />}
                            {status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Sport</p>
                            <p className="font-bold text-gray-700">{user.sport || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Time</p>
                            <p className="font-bold text-gray-700">{user.sportTime || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Amount</p>
                            <p className="font-black text-green-600 text-base">Rs. {user.amount}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Method</p>
                            <p className="font-bold text-gray-700">{user.method || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                    <span className="text-sm text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-800">{Math.min(currentPage * itemsPerPage, processedUsers.length)}</span> of <span className="font-bold text-gray-800">{processedUsers.length}</span> entries
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-sm"
                      >
                        Prev
                      </button>
                      
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${
                              currentPage === idx + 1 
                                ? "bg-green-600 text-white font-bold shadow-md shadow-green-200" 
                                : "text-gray-600 hover:bg-gray-50 hover:border-gray-300 border border-transparent font-semibold"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>

                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-bold shadow-sm"
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
      </div>
    </div>
  );
}

export default Payment;
