import React, { useEffect } from 'react';

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement>;
}

const CameraFeed: React.FC<CameraFeedProps> = ({ videoRef }) => {
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 1280,
            height: 720,
            facingMode: 'user'
          },
          audio: false
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startCamera();
  }, [videoRef]);

  return (
    <video
      ref={videoRef}
      className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 filter contrast-125 brightness-75 grayscale-[0.3]"
      playsInline
    />
  );
};

export default CameraFeed;