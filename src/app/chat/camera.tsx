"use client";

import React, { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { useUploadThing } from '~/utils/uploadthing';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Camera as CameraIcon, Trash2, Upload, Circle, X } from 'lucide-react';

const errorMessages = {
    noCameraAccessible: undefined,
    permissionDenied: undefined,
    switchCamera: undefined,
    canvas: undefined,
};

interface InlineCameraProps {
    onClose: () => void;
    onImageUploaded: (imageUrl: string) => void;
}

export const InlineCamera = ({ onClose, onImageUploaded }: InlineCameraProps) => {
    const camera = useRef(null);
    const [image, setImage] = useState<string | undefined>(undefined);
    const [numberOfCameras, setNumberOfCameras] = useState(0);

    const base64ToFile = (base64: string, filename: string) => {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || '';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onUploadBegin() {
            toast(
                <div className="flex items-center gap-2 text-white">
                    <span className="text-lg">Uploading...</span>
                </div>,
                {
                    duration: 100000,
                    id: "upload-begin",
                },
            );
        },
        onUploadError(error) {
            toast.dismiss("upload-begin");
            toast.error("Upload failed");
        },
        onClientUploadComplete(result) {
            toast.dismiss("upload-begin");
            toast("Upload complete!");
            
            if (result && result[0]) {
                const imageUrl = result[0].url;
                onImageUploaded?.(imageUrl);
            }
            onClose();
        },
    });

    const handleUpload = async () => {
        if (!image) return;

        const file = base64ToFile(image, `photo-${Date.now()}.png`);
        const result = await startUpload([file]);

        if (result) {
            console.log('Image uploaded successfully', result);
        } else {
            console.error('Failed to upload image');
        }
    };

    return (
        <div className="w-full">
            {!image ? (
                <div className="relative">
                    <div className="h-[350px] relative">
                        <Camera 
                            ref={camera}
                            numberOfCamerasCallback={setNumberOfCameras}
                            errorMessages={errorMessages}
                            className="w-full h-full"
                        />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            {numberOfCameras > 1 && (
                                <Button
                                    onClick={() => camera.current?.switchCamera()}
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-[#2a2a2c] hover:bg-[#323234] border-gray-700"
                                >
                                    <CameraIcon className="h-5 w-5 text-white" />
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    const photo = camera.current?.takePhoto();
                                    setImage(photo);
                                }}
                                size="icon"
                                className="h-12 w-12 rounded-full bg-[#2a2a2c] hover:bg-[#323234] border-gray-700"
                            >
                                <Circle className="h-6 w-6 text-white opacity-60" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative">
                    <div className="h-[350px] relative flex items-center justify-center">
                        <img src={image} alt='Preview' className="h-full w-full object-cover" />
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                            <Button 
                                onClick={() => setImage(undefined)}
                                size="icon"
                                variant="destructive"
                                className="h-10 w-10 rounded-full"
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                            <Button 
                                onClick={handleUpload} 
                                disabled={isUploading}
                                size="icon"
                                className="h-10 w-10 rounded-full bg-[#2a2a2c] hover:bg-[#323234] border-gray-700"
                            >
                                <Upload className="h-5 w-5 text-white" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}; 