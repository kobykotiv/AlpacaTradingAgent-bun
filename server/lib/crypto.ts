/**
 * Crypto utilities for AES-256-GCM encryption/decryption
 * Used to securely store API keys and secrets in the database
 */

import crypto from 'crypto';
import { getConfig } from './config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM, this is always 16
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bits

/**
 * Derives an encryption key from the master secret using PBKDF2
 */
function deriveKey(masterSecret: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterSecret, salt, 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypts a plaintext string using AES-256-GCM
 * Returns base64 encoded string containing salt + iv + tag + ciphertext
 */
export function encrypt(plaintext: string): string {
  const { secretKey } = getConfig();
  
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from master secret
  const key = deriveKey(secretKey, salt);
  
  // Create cipher
  const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
  cipher.setAAD(salt); // Use salt as additional authenticated data
  
  // Encrypt
  let ciphertext = cipher.update(plaintext, 'utf8');
  ciphertext = Buffer.concat([ciphertext, cipher.final()]);
  
  // Get authentication tag
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + ciphertext and encode as base64
  const result = Buffer.concat([salt, iv, tag, ciphertext]);
  return result.toString('base64');
}

/**
 * Decrypts a base64 encoded string encrypted with encrypt()
 */
export function decrypt(encryptedData: string): string {
  const { secretKey } = getConfig();
  
  // Decode from base64
  const buffer = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const ciphertext = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  
  // Derive key from master secret
  const key = deriveKey(secretKey, salt);
  
  // Create decipher
  const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
  decipher.setAAD(salt); // Use salt as additional authenticated data
  decipher.setAuthTag(tag);
  
  // Decrypt
  let plaintext = decipher.update(ciphertext, undefined, 'utf8');
  plaintext += decipher.final('utf8');
  
  return plaintext;
}

/**
 * Generates a secure random string for use as API keys, tokens, etc.
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}