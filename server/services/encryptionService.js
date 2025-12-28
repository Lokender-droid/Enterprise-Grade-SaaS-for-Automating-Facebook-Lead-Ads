const crypto = require('crypto');

/**
 * ENCRYPTION SERVICE
 * AES-256-GCM encryption for sensitive data at rest
 */

// Get encryption key from environment (32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

// Ensure key is correct length
const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For GCM mode

/**
 * Encrypt text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:encryptedData:authTag
 */
exports.encrypt = (text) => {
    if (!text) return null;

    try {
        // Generate random IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);

        // Encrypt data
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        // Return iv:encryptedData:authTag (all in hex)
        return `${iv.toString('hex')}:${encrypted}:${authTag.toString('hex')}`;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypt text using AES-256-GCM
 * @param {string} encryptedText - Encrypted text in format: iv:encryptedData:authTag
 * @returns {string} - Decrypted plain text
 */
exports.decrypt = (encryptedText) => {
    if (!encryptedText) return null;

    // Check if data is encrypted (has the format iv:data:tag)
    if (!encryptedText.includes(':')) {
        // Return as-is (backward compatibility for unencrypted data)
        return encryptedText;
    }

    try {
        // Split encrypted text into components
        const parts = encryptedText.split(':');

        if (parts.length !== 3) {
            throw new Error('Invalid encrypted data format');
        }

        const iv = Buffer.from(parts[0], 'hex');
        const encryptedData = parts[1];
        const authTag = Buffer.from(parts[2], 'hex');

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv);
        decipher.setAuthTag(authTag);

        // Decrypt data
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        // Return original if decryption fails (backward compatibility)
        return encryptedText;
    }
};

/**
 * Check if text is encrypted
 * @param {string} text - Text to check
 * @returns {boolean} - True if encrypted
 */
exports.isEncrypted = (text) => {
    if (!text) return false;
    // Encrypted format: hex:hex:hex (3 parts separated by colons)
    const parts = text.split(':');
    return parts.length === 3 && /^[0-9a-f]+$/i.test(parts[0]);
};

/**
 * Generate a secure random encryption key (for .env setup)
 * @returns {string} - 64-character hex string (32 bytes)
 */
exports.generateEncryptionKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Log warning if using default key
if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in environment. Using temporary key.');
    console.warn('   Generate a key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

module.exports = exports;
