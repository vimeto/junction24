// components/IphoneLayout.tsx

import React, { ReactNode } from "react";

interface auditsLayoutProps {
  children: ReactNode;
}

const AuditsLayout: React.FC<auditsLayoutProps> = ({ children }) => {
  return (
    <div className="mx-auto flex corrected-h-screen w-full items-center justify-center">
      <div className="h-full max-h-[800px] max-w-md">{children}</div>
    </div>
  );
};

export default AuditsLayout;
