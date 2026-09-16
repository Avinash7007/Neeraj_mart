import React from "react";
import { FaWhatsapp, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { assets } from '../assets/assets.js'

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-center w-full mt-18 py-10 bg-gradient-to-b from-orange-100/10 to-orange-200">
        <div className="flex items-center ">
            <img className="hover:bg-orange-100/40 p-2 rounded-2xl cursor-pointer" src={assets.logo} alt="Neeraj Mart logo" />
        </div>

        <p className="mt-2 text-center text-gray-600 text-sm italic">
            Apna Store, Swadeshi Aur Sasta!
        </p>

        {/* Contact info */}
        <div className="flex flex-col items-center gap-1.5 mt-5 text-sm text-gray-700">
            <a href="tel:+919935118811" className="flex items-center gap-2 hover:text-primary-dull transition">
                <FaPhoneAlt /> +91 99351 18811
            </a>
            <a href="https://wa.me/919935118811" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary-dull transition">
                <FaWhatsapp className="text-lg" /> Chat on WhatsApp
            </a>
            <p className="flex items-center gap-2">
                <FaMapMarkerAlt /> Jalalpur Panwara, Kannauj – 209727
            </p>
        </div>

        {/* Copyright */}
        <p className="mt-5 text-center text-gray-700 text-sm">
            Copyright © {new Date().getFullYear()} Neeraj General Store. All rights reserved.
        </p>
    </footer>
  );
}

export default Footer;
