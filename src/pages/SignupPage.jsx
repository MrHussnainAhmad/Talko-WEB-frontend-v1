import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore.js";
import {
  EyeOff,
  Mail,
  MessageCircle,
  User,
  Eye,
  Lock,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthImage from "../components/AuthImage";
import  toast  from "react-hot-toast";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    password: "",
  });
  const { signup, isSignup } = useAuthStore();

  const validateForm = () => {
    const { fullname, username, email, password } = formData;
    if (!fullname || !username || !email || !password) {
      toast.error("All fields are required");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    if (!formData.email.trim()) return toast.error("Email is required");

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = validateForm();
    if (success === true) {
      const result = await signup(formData);
      if (result.success) {
        console.log("Signup successful!");
      } else {
        console.log("Signup failed:", result.message);
      }
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-purple-100 via-purple-200 to-indigo-200">
      {/* Left-side */}
      <div className="flex flex-col justify-center items-center bg-white/70 backdrop-blur-sm p-8 rounded-lg shadow-lg">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="w-15 h-15 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <MessageCircle
                  className="w-10 h-10 text-purple-600 stroke-current"
                  strokeWidth={2}
                  style={{ display: "block", opacity: 1 }}
                />
              </div>
              <h1 className="text-2xl font-bold text-center">Signup Page</h1>
              <p className="text-base-center/60">Create your account</p>
            </div>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <User
                    className="w-5 h-5 text-gray-600 stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <input
                  type="text"
                  className={"input input-bordered w-full pl-10"}
                  placeholder="Enter Your Full Name"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({ ...formData, fullname: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Username</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <User
                    className="w-5 h-5 text-gray-600 stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <input
                  type="text"
                  className={"input input-bordered w-full pl-10"}
                  placeholder="Enter A Username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail
                    className="w-5 h-5 text-gray-600 stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <input
                  type="text"
                  className={"input input-bordered w-full pl-10"}
                  placeholder="Yourmail@service.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock
                    className="w-5 h-5 text-gray-600 stroke-current"
                    strokeWidth={2}
                    style={{ display: "block", opacity: 1 }}
                  />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={"input input-bordered w-full pl-10"}
                  placeholder="Enter A Password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff
                      className="w-5 h-5 text-gray-600 hover:text-gray-800"
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      className="w-5 h-5 text-gray-600 hover:text-gray-800"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSignup}
            >
              {isSignup ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Signing Up...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in{" "}
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right-Side */}
      <AuthImage title="Start Your Private Chat, Today!" 
      subtitle="Your messages are secure and private."
      />
    </div>
  );
};

export default SignupPage;
