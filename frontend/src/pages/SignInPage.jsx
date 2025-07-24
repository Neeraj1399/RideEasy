// frontend/src/pages/SignInPage.jsx
import { SignIn } from "@clerk/clerk-react";

function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Welcome Back to RideEasy!
        </h2>
        <SignIn path="/sign-in" routing="path" />
      </div>
    </div>
  );
}

export default SignInPage;
