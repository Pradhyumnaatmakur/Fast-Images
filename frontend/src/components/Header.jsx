import React from "react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-black text-white py-4 shadow-lg font-mono">
      <div className="container mx-auto px-4">
        <Link to="/" className="block">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center hover:text-gray-300 transition-colors duration-200">
            Fast Images
          </h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
