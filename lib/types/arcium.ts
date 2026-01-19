// TypeScript types for Arcium MPC encryption

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

export interface EncryptedConversation {
  encryptedData: string;
  decryptionKey: string;
  timestamp: number;
  mxeAddress: string;
}

export interface ArciumClient {
  encrypt(data: string): Promise<string>;
  decrypt(encryptedData: string, decryptionKey: string): Promise<string>;
  generateDecryptionKey(): Promise<string>;
}

export interface ArciumConfig {
  mxeAddress: string;
  clusterId: string;
  rpcUrl: string;
  network: string;
}

export interface EncryptionResult {
  success: boolean;
  encryptedData?: string;
  decryptionKey?: string;
  error?: string;
  timestamp?: number;
  mxeAddress?: string;
}

export interface DecryptionResult {
  success: boolean;
  decryptedData?: string;
  error?: string;
}
