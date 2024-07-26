import React, { useRef, useEffect, useState } from 'react';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import './ObjectDetection.css'; // Import CSS for styling

const ObjectDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [lastAnnouncedObject, setLastAnnouncedObject] = useState(null);

  useEffect(() => {
    // Function to check WebGL support
    const checkWebGLSupport = () => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    };

    if (!checkWebGLSupport()) {
      alert('Your browser does not support WebGL, which is required for this application.');
      return;
    }

    // Load the model
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
      console.log('Model loaded successfully!');
    };

    loadModel();
  }, []);

  useEffect(() => {
    const setupCamera = async () => {
      if (!videoRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });

        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          console.log('Video Dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);

          // Ensure canvas dimensions match video dimensions
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        };
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    setupCamera();
  }, [videoRef]);

  useEffect(() => {
    let frameId;

    const detectObjects = async () => {
      if (model && videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const predictions = await model.detect(videoRef.current);

        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        let detectedObject = null;

        // Find the highest probability prediction and its class
        for (const prediction of predictions) {
          if (prediction.score > 0.5) { // Adjust the threshold as needed
            detectedObject = prediction.class;
            break;
          }
        }

        if (detectedObject && detectedObject !== lastAnnouncedObject) {
          const message = `${detectedObject.charAt(0).toUpperCase() + detectedObject.slice(1)} detected`;
          const utterance = new SpeechSynthesisUtterance(message);
          window.speechSynthesis.speak(utterance);
          setLastAnnouncedObject(detectedObject);
        } else if (!detectedObject) {
          setLastAnnouncedObject(null); // Reset when no object is detected
        }

        // Draw bounding boxes and labels
        predictions.forEach((prediction) => {
          const [x, y, width, height] = prediction.bbox;

          // Draw bounding box
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);

          // Draw label
          ctx.fillStyle = '#00FF00';
          ctx.font = '18px Arial';
          ctx.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(1)}%)`,
            x,
            y > 10 ? y - 5 : 10
          );
        });
      }

      // Continue detection in the next frame
      frameId = requestAnimationFrame(detectObjects);
    };

    if (model && videoRef.current) {
      detectObjects();
    }

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [model, videoRef, lastAnnouncedObject]);

  return (
    <div className="webcam-container">
      <video ref={videoRef} className="webcam" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="overlay" />
    </div>
  );
};

export default ObjectDetection;
