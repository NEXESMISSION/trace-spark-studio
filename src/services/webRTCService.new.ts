import { supabase } from "@/integrations/supabase/client";
import { SESSION_KEYS } from "./sessionService";

// Local storage key for WebRTC session
const WEBRTC_SESSION_KEY = SESSION_KEYS.WEBRTC_SESSION;

// Generate a unique device ID that persists across sessions
function getDeviceId(): string {
  const storedDeviceId = localStorage.getItem('device_id');
  if (storedDeviceId) return storedDeviceId;
  
  // Generate a new device ID if none exists
  const newDeviceId = 'device_' + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('device_id', newDeviceId);
  return newDeviceId;
}

// Get current timestamp in ISO format
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// Configuration for RTCPeerConnection
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Types for signal data
interface SignalData {
  type: 'offer' | 'answer' | 'ice-candidate' | 'offer-request';
  sender: string;
  receiver?: string;
  data: any;
}

interface BroadcasterStatus {
  broadcaster_id: string;
  is_active: boolean;
  started_at: string;
  user_id?: string | null;
  device_id?: string;
}

// Add this type to help with the Supabase queries
interface BroadcastingStatusRow {
  id: string;
  broadcaster_id: string;
  is_active: boolean;
  started_at: string;
  user_id?: string | null;
  device_id?: string;
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream = new MediaStream();
  private clientId: string;
  private deviceId: string;
  private userId: string | null = null;
  private channel: any = null;
  private isBroadcaster = false;
  private isInitialized = false;
  private connectionError: Error | null = null;
  private activeBroadcasters: BroadcasterStatus[] = [];

  constructor() {
    // Get device ID (persists across browser sessions)
    this.deviceId = getDeviceId();
    
    // Try to restore client ID from session storage or generate a new one
    const savedSession = this.loadSession();
    if (savedSession && savedSession.clientId) {
      this.clientId = savedSession.clientId;
    } else {
      // Generate a unique client ID for this session
      this.clientId = `${this.deviceId}_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;
      this.saveSession();
    }
    
    // Try to get user ID if authenticated
    this.getUserId().then(userId => {
      if (userId) {
        this.userId = userId;
        this.saveSession();
      }
    }).catch(err => {
      console.error('Error getting user ID:', err);
    });
  }
  
  // Save session data to localStorage
  private saveSession() {
    try {
      const sessionData = {
        clientId: this.clientId,
        deviceId: this.deviceId,
        userId: this.userId,
        isBroadcaster: this.isBroadcaster,
        lastActive: getCurrentTimestamp()
      };
      localStorage.setItem(WEBRTC_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving WebRTC session:', error);
    }
  }
  
  // Get current user ID from Supabase
  private async getUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      return data.user?.id || null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }
  
  // Load session data from localStorage
  private loadSession() {
    try {
      const sessionData = localStorage.getItem(WEBRTC_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('Error loading WebRTC session:', error);
      return null;
    }
  }

  // Initialize WebRTC service
  async initialize(isPublisher: boolean = false) {
    try {
      // If already initialized, clean up first
      if (this.isInitialized) {
        await this.stop();
      }
      
      this.connectionError = null;
      this.isBroadcaster = isPublisher;
      
      // Create peer connection
      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Set up Supabase channel for signaling
      await this.setupSignalingChannel();
      
      if (isPublisher) {
        // Don't await this to avoid blocking if there's an error
        this.publishStatus().catch(err => {
          console.error('Error publishing status (non-blocking):', err);
          this.connectionError = err instanceof Error ? err : new Error('Unknown error publishing status');
        });
      }
      
      this.isInitialized = true;
      this.saveSession();
      
      return this.remoteStream;
    } catch (error) {
      console.error('Error initializing WebRTC service:', error);
      this.connectionError = error instanceof Error ? error : new Error('Unknown error initializing WebRTC');
      throw error;
    }
  }

  // Set local stream to be shared
  async setLocalStream(stream: MediaStream) {
    this.localStream = stream;
    
    // Add all tracks from local stream to peer connection
    if (this.peerConnection && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }
  }
  
  // Set up event listeners for the peer connection
  private setupEventListeners() {
    if (!this.peerConnection) return;
    
    // When ICE candidate is available
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          sender: this.clientId,
          data: event.candidate,
        });
      }
    };
    
    // When a new track is received
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
      });
    };
  }
  
  // Set up Supabase Realtime channel for signaling
  private async setupSignalingChannel() {
    // Create a channel for signaling
    this.channel = supabase.channel('webrtc-signaling')
      .on('broadcast', { event: 'signal' }, (payload) => {
        const signal = payload.payload as SignalData;
        
        // Only process signals meant for us or broadcast signals
        if (!signal.receiver || signal.receiver === this.clientId) {
          this.handleSignal(signal);
        }
      })
      .subscribe();
  }
  
  // Publish status as a broadcaster
  private async publishStatus() {
    try {
      // Get user ID if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update user ID if available
      if (user && !this.userId) {
        this.userId = user.id;
        this.saveSession();
      }
      
      const broadcaster: BroadcasterStatus = {
        broadcaster_id: this.clientId,
        is_active: true,
        started_at: getCurrentTimestamp(),
        user_id: this.userId || null,
        device_id: this.deviceId
      };
      
      // First try the RPC method
      try {
        await supabase.rpc('insert_broadcasting_status', {
          p_broadcaster_id: broadcaster.broadcaster_id,
          p_is_active: broadcaster.is_active,
          p_user_id: broadcaster.user_id || null,
          p_device_id: broadcaster.device_id
        });
        return;
      } catch (rpcError) {
        console.error("RPC method not available, falling back to direct insert:", rpcError);
      }
      
      // Fallback to direct insert if RPC fails
      const { error } = await supabase
        .from('broadcasting_status')
        .insert([
          {
            broadcaster_id: broadcaster.broadcaster_id,
            is_active: broadcaster.is_active,
            started_at: broadcaster.started_at,
            user_id: broadcaster.user_id || null,
            device_id: broadcaster.device_id
          }
        ]);
      
      if (error) {
        console.error("Error inserting broadcast status:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error publishing broadcast status:", error);
      throw error;
    }
  }
  
  // Unpublish status when stopping broadcast
  private async unpublishStatus() {
    if (this.isBroadcaster) {
      try {
        // First try the RPC method
        try {
          await supabase.rpc('update_broadcasting_status', {
            p_broadcaster_id: this.clientId,
            p_is_active: false
          });
          return;
        } catch (rpcError) {
          console.error("RPC method not available, falling back to direct update:", rpcError);
        }
        
        // Fallback to direct update if RPC fails
        const { error } = await supabase
          .from('broadcasting_status')
          .update({ is_active: false })
          .eq('broadcaster_id', this.clientId);
        
        if (error) {
          console.error("Error updating broadcast status:", error);
          throw error;
        }
      } catch (error) {
        console.error("Error unpublishing broadcast status:", error);
        throw error;
      }
    }
  }
  
  // Send signal through Supabase Realtime
  private async sendSignal(signal: SignalData) {
    await this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: signal,
    });
  }
  
  // Handle incoming signal
  private async handleSignal(signal: SignalData) {
    if (!this.peerConnection) {
      console.error("Peer connection not initialized");
      return;
    }
    
    switch (signal.type) {
      case 'offer-request':
        if (this.isBroadcaster) {
          try {
            // Create an offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            // Send the offer to the requester
            this.sendSignal({
              type: 'offer',
              sender: this.clientId,
              receiver: signal.sender,
              data: offer,
            });
          } catch (error) {
            console.error("Error creating offer:", error);
          }
        }
        break;
        
      case 'offer':
        if (!this.isBroadcaster) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            this.sendSignal({
              type: 'answer',
              sender: this.clientId,
              receiver: signal.sender,
              data: answer,
            });
          } catch (error) {
            console.error("Error handling offer:", error);
          }
        }
        break;
        
      case 'answer':
        if (this.isBroadcaster) {
          try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.data));
          } catch (error) {
            console.error("Error handling answer:", error);
          }
        }
        break;
        
      case 'ice-candidate':
        try {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.data));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
        break;
    }
  }
  
  // Start broadcasting - called by the publisher
  async startBroadcasting() {
    try {
      if (!this.peerConnection || !this.localStream) {
        throw new Error("WebRTC not initialized or no local stream available");
      }
      
      // Ensure we're set as a broadcaster
      this.isBroadcaster = true;
      
      // Publish status
      await this.publishStatus();
      
      // Save session
      this.saveSession();
      
      return true;
    } catch (error) {
      console.error("Error starting broadcasting:", error);
      this.connectionError = error instanceof Error ? error : new Error('Unknown error starting broadcast');
      throw error;
    }
  }
  
  // Start viewing - called by viewers
  async startViewing(preferredBroadcasterId?: string) {
    try {
      // First check if we have active broadcasters already
      if (this.activeBroadcasters.length === 0) {
        await this.checkForActiveBroadcasters(true); // Exclude current device
      }
      
      // If we still don't have any broadcasters, try the RPC method
      if (this.activeBroadcasters.length === 0) {
        try {
          const { data, error } = await supabase.rpc('get_active_broadcasters');
          if (!error && data && data.length > 0) {
            this.activeBroadcasters = data as BroadcasterStatus[];
          }
        } catch (rpcError) {
          console.error("RPC method not available, falling back to direct query:", rpcError);
        }
      }
      
      // Fallback to direct query if we still don't have broadcasters
      if (this.activeBroadcasters.length === 0) {
        const { data, error } = await supabase
          .from('broadcasting_status')
          .select('broadcaster_id, device_id, user_id')
          .eq('is_active', true)
          .neq('device_id', this.deviceId) // Don't connect to self
          .order('started_at', { ascending: false });
        
        if (!error && data && data.length > 0) {
          this.activeBroadcasters = data as BroadcasterStatus[];
        }
      }
      
      if (this.activeBroadcasters.length > 0) {
        let targetBroadcaster = this.activeBroadcasters[0];
        
        // If a preferred broadcaster ID is provided, try to find it
        if (preferredBroadcasterId) {
          const preferred = this.activeBroadcasters.find(b => b.broadcaster_id === preferredBroadcasterId);
          if (preferred) {
            targetBroadcaster = preferred;
          }
        } 
        // Otherwise, if user is logged in, prioritize broadcasters from the same account
        else if (this.userId) {
          const sameAccountBroadcaster = this.activeBroadcasters.find(b => 
            b.user_id === this.userId && b.device_id !== this.deviceId
          );
          if (sameAccountBroadcaster) {
            targetBroadcaster = sameAccountBroadcaster;
          }
        }
        
        // Request to connect with the selected broadcaster
        this.sendSignal({
          type: 'offer-request',
          sender: this.clientId,
          receiver: targetBroadcaster.broadcaster_id,
          data: {
            deviceId: this.deviceId,
            userId: this.userId
          },
        });
        
        return targetBroadcaster;
      } else {
        console.log("No active broadcasters found");
        throw new Error("No active broadcasters found");
      }
    } catch (error) {
      console.error("Error starting viewing:", error);
      this.connectionError = error instanceof Error ? error : new Error('Error connecting to broadcaster');
      throw error;
    }
  }
  
  // Stop the connection and clean up
  async stop() {
    try {
      // Unpublish status if we're a broadcaster
      if (this.isBroadcaster) {
        try {
          await this.unpublishStatus();
        } catch (error) {
          console.error("Error unpublishing status:", error);
        }
      }
      
      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.onicecandidate = null;
        this.peerConnection.ontrack = null;
        this.peerConnection.close();
        this.peerConnection = null;
      }
      
      // Stop local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Remove all tracks from remote stream
      this.remoteStream.getTracks().forEach(track => {
        this.remoteStream.removeTrack(track);
        track.stop();
      });
      
      // Unsubscribe from channel
      if (this.channel) {
        await supabase.removeChannel(this.channel);
        this.channel = null;
      }
      
      this.isInitialized = false;
      this.isBroadcaster = false;
      this.saveSession();
      
      return true;
    } catch (error) {
      console.error("Error stopping WebRTC:", error);
      return false;
    }
  }
  
  // Check if there are any active broadcasters
  async checkForActiveBroadcasters(excludeCurrentDevice = false) {
    try {
      // First try the RPC method
      try {
        const { data, error } = await supabase.rpc('check_active_broadcasters');
        
        if (!error) {
          return data && data > 0;
        }
      } catch (rpcError) {
        console.error("RPC method not available, falling back to direct query:", rpcError);
      }
      
      // Fallback to direct query if RPC fails
      let query = supabase
        .from('broadcasting_status')
        .select('broadcaster_id, device_id, user_id')
        .eq('is_active', true);
      
      // Exclude current device if requested
      if (excludeCurrentDevice) {
        query = query.neq('device_id', this.deviceId);
      }
      
      const { data, error } = await query.limit(10);
      
      if (error) {
        console.error("Error checking for broadcasters:", error);
        return false;
      }
      
      // Store the active broadcasters for later use
      if (data) {
        // Make sure each broadcaster has a device_id
        this.activeBroadcasters = data.map((broadcaster: any) => ({
          ...broadcaster,
          device_id: broadcaster.device_id || 'unknown_device'
        })) as BroadcasterStatus[];
      }
        
      return data && data.length > 0;
    } catch (error) {
      console.error("Error in checkForActiveBroadcasters:", error);
      return false;
    }
  }
  
  // Get active broadcasters
  getActiveBroadcasters() {
    return this.activeBroadcasters;
  }
  
  // Get the client ID
  getClientId() {
    return this.clientId;
  }
  
  // Check if user is currently broadcasting
  isBroadcasting() {
    return this.isBroadcaster;
  }
  
  // Check if service is initialized
  isConnected() {
    return this.isInitialized;
  }
  
  // Get any connection error
  getConnectionError() {
    return this.connectionError;
  }
  
  // Clear connection error
  clearConnectionError() {
    this.connectionError = null;
  }
}

export const webRTCService = new WebRTCService();
