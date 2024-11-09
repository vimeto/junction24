import React from "react";
import { Camera, Download } from "lucide-react";

interface CameraMenuProps {
  onTakePhoto: () => void;
  onDownloadPhoto: () => void;
}

const CameraMenu: React.FC<CameraMenuProps> = ({ onTakePhoto, onDownloadPhoto }) => {
  return (
    <div className="absolute bottom-12 left-0 z-50 rounded-md bg-[#2a2a2c] p-1 shadow-lg">
      <button
        onClick={onTakePhoto}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-white hover:bg-[#3a3a3c]"
      >
        <Camera className="h-6 w-6" />
      </button>
      <button
        onClick={onDownloadPhoto}
        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-white hover:bg-[#3a3a3c]"
      >
        <Download className="h-6 w-6" />
      </button>
    </div>
  );
};

export default CameraMenu; 