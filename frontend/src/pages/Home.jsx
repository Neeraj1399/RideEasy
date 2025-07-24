// frontend/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

const Home = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-4xl font-bold mb-4">Welcome to RideEasy!</h1>
      <p className="text-xl text-gray-700 mb-8">
        Your convenient ride-sharing solution.
      </p>
      <SignedIn>
        <p className="text-lg">
          You are signed in. Go to your{" "}
          <Link to="/dashboard" className="text-blue-600 hover:underline">
            Dashboard
          </Link>
          .
        </p>
      </SignedIn>
      <SignedOut>
        <p className="text-lg">
          Please{" "}
          <Link to="/sign-in" className="text-blue-600 hover:underline">
            Sign In
          </Link>{" "}
          or{" "}
          <Link to="/sign-up" className="text-blue-600 hover:underline">
            Sign Up
          </Link>{" "}
          to get started.
        </p>
        <div className="mt-6">
          <Link
            to="/sign-up"
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg hover:bg-blue-700 mr-4"
          >
            Sign Up
          </Link>
          <Link
            to="/sign-in"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-md text-lg hover:bg-blue-50"
          >
            Sign In
          </Link>
        </div>
      </SignedOut>
    </div>
  );
};

export default Home;
