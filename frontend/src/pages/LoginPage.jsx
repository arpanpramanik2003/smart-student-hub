import React, { useState, useEffect } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';

const LoginPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [currentFeature, setCurrentFeature] = useState(0);

  // Rotating features carousel
  const features = [
    { icon: "📚", text: "Track Academic Activities", color: "text-blue-600" },
    { icon: "🎯", text: "Build Digital Portfolio", color: "text-green-600" },
    { icon: "📊", text: "Analytics & Reports", color: "text-purple-600" },
    { icon: "🏆", text: "Achievement Management", color: "text-orange-600" },
  ];

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header Section */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-2xl transform transition-all duration-300 hover:scale-110 hover:rotate-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Smart Student Hub
            </span>
          </h1>
          
          <p className="text-gray-600 text-lg mb-6">
            Your comprehensive platform for academic excellence
          </p>

          {/* Rotating Features */}
          <div className="h-12 flex items-center justify-center">
            <div className="flex items-center space-x-3 transition-all duration-500 transform">
              <span className="text-2xl">{features[currentFeature].icon}</span>
              <span className={`text-lg font-medium ${features[currentFeature].color} transition-colors duration-500`}>
                {features[currentFeature].text}
              </span>
            </div>
          </div>

          {/* Feature Indicators */}
          <div className="flex justify-center space-x-2 mt-4">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentFeature 
                    ? 'bg-blue-600 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Test Credentials Banner */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg p-4 mb-4 shadow-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-amber-800">
                🧪 Test Credentials (For Demo/Testing Only)
              </h3>
              <div className="mt-2 text-xs text-amber-700 space-y-2">
                <div className="bg-white/60 rounded p-2 font-mono">
                  <p className="font-semibold text-red-600">👑 Admin Account:</p>
                  <p>📧 Email: <span className="font-bold">arpan@smartstudenthub.com</span></p>
                  <p>🔑 Password: <span className="font-bold">Arpan@123.</span></p>
                </div>
                <div className="bg-white/60 rounded p-2 font-mono">
                  <p className="font-semibold text-blue-600">👨‍🎓 Student Account:</p>
                  <p>📧 Email: <span className="font-bold">student@gmail.com</span></p>
                  <p>🔑 Password: <span className="font-bold">Student@123</span></p>
                </div>
                <div className="bg-white/60 rounded p-2 font-mono">
                  <p className="font-semibold text-green-600">👨‍🏫 Teacher Account:</p>
                  <p>📧 Email: <span className="font-bold">teacher@gmail.com</span></p>
                  <p>🔑 Password: <span className="font-bold">Teacher@123</span></p>
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-600 font-medium">
                ⚠️ Note: Remove this section before final production deployment!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-sm py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20">
          {/* Form Toggle */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-l-lg transition-all duration-200 ${
                isLogin
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 text-center text-sm font-medium rounded-r-lg transition-all duration-200 ${
                !isLogin
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Forms */}
          <div className="transition-all duration-300">
            {isLogin ? (
              <LoginForm
                onLogin={onLogin}
                onSwitchToRegister={() => setIsLogin(false)}
              />
            ) : (
              <RegisterForm
                onLogin={onLogin}
                onSwitchToLogin={() => setIsLogin(true)}
              />
            )}
          </div>
        </div>

        {/* System Stats */}
        <div className="mt-8 bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h3 className="text-center text-lg font-semibold text-gray-900 mb-4">
            Trusted by Students Nationwide
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-blue-600">500+</div>
              <div className="text-xs text-gray-600">Active Students</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-green-600">1200+</div>
              <div className="text-xs text-gray-600">Activities Tracked</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-2xl font-bold text-purple-600">50+</div>
              <div className="text-xs text-gray-600">Institutions</div>
            </div>
          </div>
        </div>

        {/* Key Benefits */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {[
            { icon: "🔒", title: "Secure", desc: "Bank-level security" },
            { icon: "⚡", title: "Fast", desc: "Lightning quick" },
            { icon: "📱", title: "Mobile", desc: "Works everywhere" },
            { icon: "🎯", title: "Smart", desc: "AI-powered insights" }
          ].map((benefit, index) => (
            <div 
              key={benefit.title}
              className="bg-white/40 backdrop-blur-sm rounded-lg p-3 text-center border border-white/20 hover:bg-white/60 transition-all duration-300 hover:scale-105"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="text-lg mb-1">{benefit.icon}</div>
              <div className="text-sm font-medium text-gray-900">{benefit.title}</div>
              <div className="text-xs text-gray-600">{benefit.desc}</div>
            </div>
          ))}
        </div>

        {/* Enhanced Footer */}
        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500 space-y-3">
            <div className="flex justify-center items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>System Status: All services operational</span>
            </div>
            
            <p>© 2025 Smart Student Hub. All rights reserved.</p>
            
            <div className="flex justify-center space-x-4 text-xs">
              <button className="hover:text-blue-600 transition-colors duration-200 underline decoration-dotted">
                Privacy Policy
              </button>
              <span>•</span>
              <button className="hover:text-blue-600 transition-colors duration-200 underline decoration-dotted">
                Terms of Service
              </button>
              <span>•</span>
              <button className="hover:text-blue-600 transition-colors duration-200 underline decoration-dotted">
                Contact Support
              </button>
            </div>

            <div className="flex justify-center items-center space-x-4 text-xs pt-2">
              <div className="flex items-center">
                <div className="w-1 h-1 bg-blue-500 rounded-full mr-1"></div>
                Version 2.1.0
              </div>
              <div className="flex items-center">
                <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
                99.9% Uptime
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
