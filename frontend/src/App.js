
import './App.css';
import Home from './Components/Home/Home'; 
import HomeAdmin from "../src/Components/HomeAdmin/HomeAdmin";
import AddUser from "../src/Components/AddUser/AddUser";
import Users from "../src/Components/UserDetails/Users";
import UpdateUser from "../src/Components/UpdateUser/UpdateUser";
import LandingPage from "../src/Components/LandingPage/LandingPage";
import Register from "../src/Components/Register/Register";
import AdminRegister from "../src/Components/AdminRegister/AdminRegister";
import Profile from "../src/Components/Profile/Profile";
import AdminProfile from "./Components/Admin/AdminProfile";
import AdminFacilities from "./Components/Admin/AdminFacilities";
import Tickets from "../src/Components/Tickets/Tickets";
import Feedback from "../src/Components/Feedback/Feedback";
import { AuthProvider, useAuth } from "../src/Components/Context/AuthContext";
import ProtectedRoute from "../src/Components/Context/ProtectedRoute";
import ForgotPassword from "../src/Components/ForgotPassword";
import ResetPassword from "../src/Components/ResetPassword";
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminTickets from "../src/Components/AdminTickets/AdminTickets";
import Payment from "../src/Components/payment/Payment";
import DetailsPayment from "../src/Components/DetailsPayment/DetailsPayment";
import Dashboard1 from './Components/Event/Dashboard1';
import AddEvent from '../src/Components/Event/AddEvent';
import EventList from '../src/Components/Event/EventList';
import UpdateEvent from '../src/Components/Event/UpdateEvent';
import EventDetails from '../src/Components/Event/EventDetails';
import ViewEvent from '../src/Components/Event/ViewEvent';
import ViewAll from '../src/Components/Event/ViewAll';
import EventRegistrations from '../src/Components/Event/EventRegistrations';
import CustomerEventList from '../src/Components/Event/Customer/CustomerEventList';
import CustomerEventDetails from '../src/Components/Event/Customer/CustomerEventDetails';
import RegisterEvent from '../src/Components/Event/Customer/RegisterEvent';
import UserItemList from '../src/Components/Inventory/UserItemsList';
import Dashboard2 from '../src/Components/Inventory/Dashboard2';
import AdminBooking from  '../src/Components/Adminbooking/Adminbooking';
import UserBooking from '../src/Components/UserBooking/Userbooking';
import BookingReports from '../src/Components/BookingReports/BookingReports';
import MembershipPlans from './Components/Membership/MembershipPlans';
import MembershipPayment from './Components/Membership/MembershipPayment';
import MyMembership from './Components/Membership/MyMembership';

// PublicRoute: if already authenticated, redirect to /home; otherwise render children (e.g., LandingPage)
function PublicRoute({ children }) {
  const { auth } = useAuth();
  if (auth) {
    // If logged in and admin, go to admin dashboard (/userdetails); otherwise go to home
    return <Navigate to={auth.role === 'admin' ? '/userdetails' : '/home'} replace />;
  }
  return children;
}

// RoleRedirect: when used inside a protected route, redirect admins to dashboard automatically
function RoleRedirect({ children }) {
  const { auth } = useAuth();
  if (auth && auth.role === 'admin') {
    return <Navigate to="/userdetails" replace />;
  }
  return children;
}

function App() {
  return (
    <div>
      <AuthProvider>
        {/* Optional: <Nav1 /> */}
        <Routes>
          {/* Default landing at root; if authenticated, redirect to /home */}
          <Route path="/" element={ <PublicRoute> <LandingPage /> </PublicRoute> }/>
          <Route path="/detailsPayment" element={<ProtectedRoute role="admin"> <DetailsPayment /> </ProtectedRoute> } />

          {/* Keep legacy landing path working */}
          <Route path="/landingPage" element={<PublicRoute><LandingPage /></PublicRoute>}/>

          {/* After login, go to /home */}
          <Route path="/home" element={ <ProtectedRoute> <RoleRedirect> <Home /> </RoleRedirect> </ProtectedRoute>} />

          <Route path="/register" element={<Register />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/HomeAdmin" element={ <ProtectedRoute> <HomeAdmin /></ProtectedRoute> } />
          <Route path="/userdetails" element={ <ProtectedRoute role="admin"> <Users /> </ProtectedRoute>} />
          <Route path="/tickets" element={ <ProtectedRoute> <Tickets /></ProtectedRoute>}/>
          <Route path="/admin/tickets" element={ <ProtectedRoute role="admin"> <AdminTickets /></ProtectedRoute>} />
          <Route path="/admin/facilities" element={ <ProtectedRoute role="admin"> <AdminFacilities /></ProtectedRoute>} />
          <Route path="/feedback" element={ <ProtectedRoute> <Feedback /></ProtectedRoute>} />
          <Route path="/payment" element={ <ProtectedRoute> <Payment /></ProtectedRoute>} />
          <Route path="/adduser" element={ <ProtectedRoute role="admin"> <AddUser /> </ProtectedRoute>}/>
          <Route path="/userdetails/:id" element={ <ProtectedRoute> <UpdateUser /> </ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
          <Route path="/admin/profile" element={ <ProtectedRoute role="admin"> <AdminProfile /> </ProtectedRoute> } />

        <Route path="/dashboard" element={ <ProtectedRoute role="admin"> <Dashboard1 /> </ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute  role="admin"> <EventList /> </ProtectedRoute>} />
        <Route path="/events/add" element={<ProtectedRoute  role="admin"> <AddEvent /> </ProtectedRoute>} />
        <Route path="/events/update/:id" element={<ProtectedRoute  role="admin"> <UpdateEvent /> </ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute  role="admin"> <EventDetails /> </ProtectedRoute>} />
        <Route path="/events/view/:id" element={<ProtectedRoute  role="admin"> <ViewEvent /> </ProtectedRoute>} />
        <Route path="/viewall" element={<ViewAll />} />
        <Route path="/itemlist" element={ <ProtectedRoute> <UserItemList /> </ProtectedRoute>} />
        <Route path="/booking" element={ <ProtectedRoute role="admin"> <AdminBooking /> </ProtectedRoute>}/>
        <Route path="/booking-reports" element={ <ProtectedRoute role="admin"> <BookingReports /> </ProtectedRoute>}/>
        <Route path="/bookingForm" element={ <ProtectedRoute> <UserBooking /> </ProtectedRoute>}/>
          <Route path="/dashboard2" element={ <ProtectedRoute role="admin"> <Dashboard2 /> </ProtectedRoute>}/>
        {/* ✅ Manager sees registrations for a specific event */}
        <Route path="/events/:id/registrations" element={<ProtectedRoute  role="admin"> <EventRegistrations /> </ProtectedRoute>} />

        {/* ✅ Customer-facing routes */}
        <Route path="/customer/events" element={<CustomerEventList />} />
        <Route path="/customer/events/:id" element={<CustomerEventDetails />} />
        <Route path="/customer/events/:id/register" element={<RegisterEvent />} />

        {/* ✅ Membership Routes */}
        <Route path="/membership/plans" element={<ProtectedRoute><MembershipPlans /></ProtectedRoute>} />
        <Route path="/membership/payment" element={<ProtectedRoute><MembershipPayment /></ProtectedRoute>} />
        <Route path="/membership/my" element={<ProtectedRoute><MyMembership /></ProtectedRoute>} />

           
          {/* Password Reset Routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;
