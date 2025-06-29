import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';

export const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="Privacy & Security" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          How we protect your data and respect your privacy
        </p>

        {/* Data Protection */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Shield size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Data Protection</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Finspire is designed with your privacy and security as a top priority. We implement industry-standard security measures to protect your financial data.
            </p>
            
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <Lock size={12} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">End-to-End Encryption</h3>
                  <p className="text-sm text-gray-400">
                    All sensitive data is encrypted both in transit and at rest using industry-standard encryption protocols.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <Lock size={12} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Secure Authentication</h3>
                  <p className="text-sm text-gray-400">
                    We use secure authentication methods to ensure only you can access your account.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-0.5">
                  <Lock size={12} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-white">Regular Security Audits</h3>
                  <p className="text-sm text-gray-400">
                    Our systems undergo regular security audits to identify and address potential vulnerabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Policy */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Eye size={24} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Privacy Policy</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              We believe in transparency about how we collect, use, and share your information.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white mb-2">Information We Collect</h3>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  <li>Account information (email, name)</li>
                  <li>Financial data you input (transactions, goals, budgets)</li>
                  <li>Usage information to improve our service</li>
                  <li>Device information for security and optimization</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">How We Use Your Information</h3>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  <li>To provide and maintain our service</li>
                  <li>To personalize your experience</li>
                  <li>To improve our app and develop new features</li>
                  <li>To communicate with you about your account</li>
                  <li>To ensure the security of our service</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Data Sharing</h3>
                <p className="text-sm text-gray-400">
                  We do not sell your personal information. We may share data with:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mt-1">
                  <li>Service providers who help us operate our business</li>
                  <li>Legal authorities when required by law</li>
                  <li>Business partners with your explicit consent</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
              <p className="text-sm text-purple-300">
                For the complete privacy policy, please visit our website or contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Terms of Service */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <FileText size={24} className="text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Terms of Service</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              By using Finspire, you agree to our Terms of Service, which outline your rights and responsibilities as a user.
            </p>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-white mb-2">User Accounts</h3>
                <p className="text-sm text-gray-400">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Acceptable Use</h3>
                <p className="text-sm text-gray-400">
                  You agree not to misuse our services or help anyone else do so. This includes attempting to access, tamper with, or use non-public areas of the application.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Intellectual Property</h3>
                <p className="text-sm text-gray-400">
                  Finspire and its original content, features, and functionality are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-white mb-2">Termination</h3>
                <p className="text-sm text-gray-400">
                  We reserve the right to terminate or suspend your account and access to our services at our sole discretion, without notice, for conduct that we believe violates these Terms of Service.
                </p>
              </div>
            </div>
            
            <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
              <p className="text-sm text-green-300">
                For the complete terms of service, please visit our website or contact our support team.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Profile</span>
        </button>
      </div>
    </div>
  );
};