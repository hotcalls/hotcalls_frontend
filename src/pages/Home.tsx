import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is a payment redirect first
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    
    // Check if user is logged in (this would be actual auth logic)
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    
    if (isLoggedIn) {
      // If this is a payment redirect, preserve the query params
      if (payment) {
        navigate(`/dashboard${window.location.search}`);
      } else {
        // User is logged in, go to dashboard
        navigate("/dashboard");
      }
    } else {
      // User is not logged in, go to login
      navigate("/login");
    }
  }, [navigate]);

  // Show loading or nothing while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3d5097] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Home; 