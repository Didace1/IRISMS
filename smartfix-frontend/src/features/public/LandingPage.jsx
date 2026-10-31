// src/features/public/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, 
  Laptop, 
  Tablet, 
  Watch, 
  Headphones, 
  Camera,
  Phone,
  MapPin,
  Clock,
  Star,
} from 'lucide-react';


export const LandingPage = () => {
  const SYSTEM_BACKEND_BASE_URL = process.env.REACT_APP_SYSTEM_BACKEND_URL || 'http://localhost:8080';
  const [showMobileMenu, setShowMobileMenu] = useState(false);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-blue-600 shadow-lg border-b-2 border-blue-700 sticky top-0 z-50" style={{ minHeight: '64px' }}>
        <div className="w-full px-0">
          <div className="flex justify-between items-center h-16">
            {/* Logo Only - Far Left Corner */}
            <div className="flex items-center">
              <div className="w-24 h-14 flex items-center justify-center rounded shadow-md" style={{ backgroundColor: '#fff' }}>
                <span style={{ 
                  fontFamily: 'Arial, sans-serif', 
                  letterSpacing: '0.1em', 
                  fontSize: '1.1rem',
                  color: '#2563eb', 
                  fontWeight: 'bold' 
                }}>
                  COREX
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8 pr-4 sm:pr-6 lg:pr-8">
              <a href="#home" className="text-white hover:text-blue-200 font-medium transition-colors">
                Home
              </a>
              <a href="#services" className="text-white hover:text-blue-200 font-medium transition-colors">
                Services
              </a>
              <a href="#contact" className="text-white hover:text-blue-200 font-medium transition-colors">
                Contact
              </a>
              <Link 
                to="/login" 
                className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Staff Login
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden pr-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-blue-200 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden bg-blue-600 border-t border-blue-700 py-4 px-4">
              <div className="flex flex-col space-y-4">
                <a 
                  href="#home" 
                  className="text-white hover:text-blue-200 font-medium transition-colors px-2 py-1"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Home
                </a>
                <a 
                  href="#services" 
                  className="text-white hover:text-blue-200 font-medium transition-colors px-2 py-1"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Services
                </a>
                <a 
                  href="#contact" 
                  className="text-white hover:text-blue-200 font-medium transition-colors px-2 py-1"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Contact
                </a>
                <Link 
                  to="/login" 
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-center mx-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Staff Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section with Device Images */}
      <section id="home" className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Welcome to Corex Ltd
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Your trusted partner for electronic devices and professional repair services
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a href="#services" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                  Our Services
                </a>
                <a href="#contact" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                  Contact Us
                </a>
              </div>
            </div>

            {/* Right Content - Device Showcase */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* iPhone Collection */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Smartphone className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">Smartphones</h3>
                  <p className="text-blue-100 text-sm text-center">Latest iPhone & Android devices</p>
                </div>

                {/* Smartwatch */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Watch className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">Smartwatches</h3>
                  <p className="text-blue-100 text-sm text-center">Apple Watch & fitness trackers</p>
                </div>

                {/* Laptops */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Laptop className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">Laptops</h3>
                  <p className="text-blue-100 text-sm text-center">MacBooks & Windows laptops</p>
                </div>

                {/* Accessories */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                    <Headphones className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-center mb-2">Accessories</h3>
                  <p className="text-blue-100 text-sm text-center">Cases, chargers & more</p>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-40 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-500"></div>
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full animate-pulse delay-700"></div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional repair and maintenance services for all your electronic devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Device Repair</h3>
              <p className="text-gray-600">Expert repair services for smartphones, laptops, tablets, and more with genuine parts.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Quality Assurance</h3>
              <p className="text-gray-600">All repairs come with warranty and quality guarantee for your peace of mind.</p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Fast Service</h3>
              <p className="text-gray-600">Quick turnaround times with professional diagnosis and efficient repair processes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Visit Our Store
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Come visit us for all your electronic device needs and professional repair services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>Kigali, Rwanda</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>+250 XXX XXX XXX</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span>Mon - Sat: 8:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-6">Why Choose Corex Ltd?</h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Expert technicians with years of experience</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Genuine parts and quality components</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Competitive pricing and transparent quotes</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span>Warranty on all repairs and services</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="flex items-center justify-center px-3 py-1 bg-blue-600 rounded-lg">
                <span style={{ fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.06em', fontSize: '1rem', color: '#fff', fontWeight: 900 }}>
                  COREX
                </span>
              </div>
              <span className="text-sm">© 2024 Corex Ltd. All rights reserved.</span>
            </div>
            <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
              Staff Portal
            </Link>
          </div>
        </div>
      </footer>


    </div>
  );
};