import React from 'react';
import { Info, Users, Code, Globe, Heart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TopNavigation } from '../components/layout/TopNavigation';

export const About: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-white pb-20">
      <TopNavigation title="About Finspire" />
      
      <div className="px-4 py-4 sm:py-6 space-y-6">
        <p className="text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
          Learn more about our mission and the team behind Finspire
        </p>

        {/* App Info */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-primary-500/20 rounded-lg">
              <Info size={24} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Our Mission</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Finspire was created with a simple but powerful mission: to make personal finance management accessible, engaging, and effective for everyone.
            </p>
            
            <p className="text-gray-300">
              We believe that financial well-being is a fundamental aspect of a fulfilling life, and that everyone deserves the tools and knowledge to achieve their financial goals, regardless of their background or starting point.
            </p>
            
            <div className="bg-primary-500/10 rounded-lg p-4 border border-primary-500/20">
              <p className="text-sm text-primary-300 font-medium">
                "Our goal is to inspire financial confidence and empower people to take control of their financial future."
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users size={24} className="text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Our Team</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Finspire is built by a passionate team of financial experts, designers, and developers who are committed to creating the best personal finance experience possible.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">Financial Experts</h3>
                <p className="text-sm text-gray-400">
                  Our team includes certified financial planners and analysts who ensure that our app follows sound financial principles and best practices.
                </p>
              </div>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">UX Designers</h3>
                <p className="text-sm text-gray-400">
                  Our designers are dedicated to creating an intuitive, beautiful, and accessible experience that makes finance management enjoyable.
                </p>
              </div>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">Developers</h3>
                <p className="text-sm text-gray-400">
                  Our engineering team builds robust, secure, and performant technology that works seamlessly across all devices.
                </p>
              </div>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">Customer Support</h3>
                <p className="text-sm text-gray-400">
                  Our support team is always ready to help you make the most of Finspire and answer any questions you might have.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technology */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Code size={24} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Technology</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Finspire is built using modern, cutting-edge technologies to provide a fast, reliable, and secure experience.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">React</p>
                <p className="text-xs text-gray-400">Frontend Framework</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">TypeScript</p>
                <p className="text-xs text-gray-400">Type Safety</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">Tailwind CSS</p>
                <p className="text-xs text-gray-400">Styling</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">Supabase</p>
                <p className="text-xs text-gray-400">Backend & Database</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">Recharts</p>
                <p className="text-xs text-gray-400">Data Visualization</p>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 text-center">
                <p className="font-medium text-white">Capacitor</p>
                <p className="text-xs text-gray-400">Mobile Apps</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Reach */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Globe size={24} className="text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Global Reach</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              Finspire is designed for users around the world, with support for multiple currencies, languages, and regional financial practices.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">40+ Currencies</h3>
                <p className="text-sm text-gray-400">
                  Track your finances in your local currency with accurate exchange rates.
                </p>
              </div>
              
              <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                <h3 className="font-medium text-white mb-1">Multiple Languages</h3>
                <p className="text-sm text-gray-400">
                  Use Finspire in your preferred language with our growing list of translations.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acknowledgments */}
        <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <Heart size={24} className="text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Acknowledgments</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-300">
              We'd like to thank our amazing community of users whose feedback and support have been invaluable in shaping Finspire.
            </p>
            
            <p className="text-gray-300">
              Special thanks to our early adopters, beta testers, and everyone who has contributed to making Finspire better.
            </p>
            
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <p className="text-sm text-red-300 text-center">
                Made with ❤️ by the Finspire Team
              </p>
            </div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center">
          <p className="text-sm text-gray-400">Finspire v1.0.0</p>
          <p className="text-xs text-gray-500">© 2025 Finspire. All rights reserved.</p>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
};