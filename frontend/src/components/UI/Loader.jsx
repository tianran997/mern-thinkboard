import React from 'react';

const Loader = ({ size = 'lg', message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className={`loading loading-spinner loading-${size} text-primary mb-4`}></div>
      <p className="text-base-content/70">{message}</p>
    </div>
  );
};

export default Loader;