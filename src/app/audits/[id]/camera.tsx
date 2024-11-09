// @ts-nocheck

"use client";

import React, { useRef, useState, useEffect } from 'react';
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
    const [hasPermission, setHasPermission] = useState(false);

    // Request permission once when component mounts
    useEffect(() => {
        const requestPermission = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ video: true });
                setHasPermission(true);
            } catch (err) {
                console.error("Error accessing camera:", err);
                toast.error("Camera access denied");
            }
        };
        
        requestPermission();
        
        // Cleanup
        return () => {
            if (camera.current) {
                camera.current?.stopCamera();
            }
        };
    }, []);

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
        <div className="fixed inset-0 flex items-center justify-center bg-black">
            <div className="w-full max-w-md mx-auto flex flex-col h-screen">
                <div className="h-16 bg-[#1a1a1c] border-b border-gray-800 flex-shrink-0">
                    <div className="h-full flex items-center px-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onClose}
                            className="border-none bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0">
                        {!image ? (
                            <Camera
                                ref={camera}
                                numberOfCamerasCallback={setNumberOfCameras}
                                errorMessages={errorMessages}
                                className="h-full w-full object-cover"
                                mirrored={true}
                                videoSourceDeviceId={undefined}
                                resizeMode="none"
                                imageType="png"
                                isImageMirror={false}
                                isFullscreen={false}
                            />
                        ) : (
                            <img
                                src={image}
                                alt='Preview'
                                className="h-full w-full object-cover transform scale-x-[-1]"
                            />
                        )}
                    </div>
                </div>
                <div className="h-[72px] bg-[#1a1a1c] border-t border-gray-800 flex-shrink-0">
                    {!image ? (
                        <div className="h-full flex items-center justify-center gap-4">
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
                                variant="outline"
                                size="icon"
                                className="border-none bg-transparent text-white hover:bg-transparent hover:text-neutral-700 h-12 w-12 rounded-full"
                            >
                                <Circle className="h-6 w-6 text-white" />
                            </Button>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-between px-4">
                            <Button
                                onClick={() => setImage(undefined)}
                                variant="outline"
                                size="icon"
                                className="border-none bg-[#1a1a1c] hover:bg-[#1a1a1c] text-white h-10 w-auto px-4"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                variant="outline"
                                size="icon"
                                className="border-none bg-[#1a1a1c] hover:bg-[#1a1a1c] text-white h-10 w-auto px-4 disabled:bg-[#1a1a1c]"
                            >
                                Send
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
