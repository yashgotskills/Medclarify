import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, X, Play, Pause } from 'lucide-react';

interface VideoUploadProps {
  challengeId: string;
  challengeTitle: string;
  challengeDescription: string;
  onVideoVerified: (videoUrl: string, verificationData: any) => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  challengeId,
  challengeTitle,
  challengeDescription,
  onVideoVerified
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = videoUrl;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started! Show your challenge activity clearly.');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      toast.success('Recording stopped! Review your video before submitting.');
    }
  };

  const verifyVideo = async () => {
    if (!recordedVideo) return;

    setIsVerifying(true);
    
    try {
      // Convert video to base64
      const response = await fetch(recordedVideo);
      const blob = await response.blob();
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const videoBase64 = base64Data.split(',')[1]; // Remove data:video/webm;base64, prefix

        try {
          const verificationResponse = await fetch('https://wfdxnsejkitaszxwkxxb.supabase.co/functions/v1/verify-challenge-video', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              videoBase64,
              challengeTitle,
              challengeDescription
            })
          });

          const { verification } = await verificationResponse.json();

          if (verification.isValid && verification.confidence > 70) {
            toast.success(`Video verified! ${verification.reason}`);
            onVideoVerified(recordedVideo, verification);
          } else {
            toast.error(`Video verification failed: ${verification.reason}`);
            if (verification.suggestions) {
              toast.info(verification.suggestions);
            }
          }
        } catch (error) {
          console.error('Verification error:', error);
          toast.error('Failed to verify video. Please try again.');
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('Failed to process video. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetVideo = () => {
    setRecordedVideo(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Submit Challenge Video
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Record yourself completing: {challengeTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay={isRecording}
            muted={isRecording}
            controls={!isRecording && !!recordedVideo}
          />
          
          {!isRecording && !recordedVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Camera preview will appear here</p>
              </div>
            </div>
          )}

          {recordedVideo && !isRecording && (
            <div className="absolute bottom-2 left-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={togglePlayback}
                className="bg-black/50 hover:bg-black/70"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!isRecording && !recordedVideo && (
            <Button 
              onClick={startRecording} 
              className="flex-1"
              variant="default"
            >
              <Camera className="h-4 w-4 mr-2" />
              Start Recording
            </Button>
          )}

          {isRecording && (
            <Button 
              onClick={stopRecording} 
              className="flex-1"
              variant="destructive"
            >
              Stop Recording
            </Button>
          )}

          {recordedVideo && !isRecording && (
            <>
              <Button 
                onClick={verifyVideo} 
                disabled={isVerifying}
                className="flex-1"
                variant="default"
              >
                {isVerifying ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Video
                  </>
                )}
              </Button>
              
              <Button 
                onClick={resetVideo} 
                variant="outline"
                size="icon"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
          <strong>Tips for successful verification:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Show the full activity clearly</li>
            <li>• Record for at least 10-15 seconds</li>
            <li>• Ensure good lighting</li>
            <li>• Follow the challenge requirements</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};