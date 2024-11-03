import React from "react";

const Footer = () => {
  return (
    <footer className="bg-black text-white py-4 mt-auto font-mono">
      <div className="container mx-auto px-4 text-center">
        <p>
          &copy; {new Date().getFullYear()} FASTIMAGES. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
