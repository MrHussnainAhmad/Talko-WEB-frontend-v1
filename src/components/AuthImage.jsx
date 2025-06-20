import React from "react";

const AuthImage = ({ title, subtitle }) => {
  return (
    <div className="hidden lg:flex items-center justify-center bg-base-200 p-12">
      <div className="max-w-md text-center">
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-full bg-primary/40 ${
                i % 2 === 0 ? "animate-pulse" : ""
              }`}
            />
          ))}
        </div>

        <h2 className="text-2xl font-bold text-base-content mb-4">{title}</h2>
        <p className="text-base-content/70 text-lg">{subtitle}</p>
      </div>
    </div>
  );
};

export default AuthImage;
