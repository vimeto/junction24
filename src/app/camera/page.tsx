"use client";

import React, { useRef, useState } from 'react';
import { Camera } from 'react-camera-pro';
import { useUploadThing } from '~/utils/uploadthing';
import { toast } from 'sonner';

const errorMessages = {
    noCameraAccessible: undefined,
    permissionDenied: undefined,
    switchCamera: undefined,
    canvas: undefined,
};

const CameraPage = () => {
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
        onClientUploadComplete() {
            toast.dismiss("upload-begin");
            toast("Upload complete!");
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
        <div>
            <h1>Camera</h1>
            <div className="w-48 h-48 relative">
                <Camera ref={camera} numberOfCamerasCallback={setNumberOfCameras} errorMessages={errorMessages} />
            </div>
            <img src={image} alt='Image preview' />
            <button
                onClick={() => {
                    const photo = camera.current?.takePhoto();
                    setImage(photo);
                }}
            >
                Take Photo
            </button>
            <button
                hidden={numberOfCameras <= 1}
                onClick={() => {
                    camera.current?.switchCamera();
                }}
            >
                Switch Camera
            </button>
            <button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
        </div>
    );
};

export default CameraPage;
