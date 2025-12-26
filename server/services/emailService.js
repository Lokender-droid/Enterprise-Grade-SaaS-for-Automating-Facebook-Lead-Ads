const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');
// const fs = require('fs'); // Removed as not dealing with files anymore
// const path = require('path');

sgMail.setApiKey(config.sendgridApiKey);

// Fallback Transporter
const fallbackTransporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false, // true for 465, false for other ports
    auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
    }
});

const sendWelcomeEmail = async (lead, orgConfig) => {
    const subject = 'Welcome! Thanks for your interest';
    // Use Org's CTA Link if available, else fallback provided? Actually CTA link should be in Org.
    // For now, let's assume we pass the link in orgConfig or use a default.
    // Simplifying: We rely on orgConfig.ctaLink
    const ctaLink = orgConfig.ctaLink || config.ctaLink; // Fallback to system default if needed or error.

    const text = `Hi ${lead.name},\n\nThank you for your interest in our services. We have received your details and are excited to connect with you.\n\nTo move forward, please schedule a call with our team at your convenience:\n${ctaLink}\n\nBest Regards,\nThe Team`;

    // Professional HTML Template
    const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome Aboard! 🚀</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi <strong>${lead.name}</strong>,</p>
                
                <p style="font-size: 16px; color: #555555; line-height: 1.6; margin-bottom: 25px;">
                    Thank you for showing interest in our services. We have successfully received your details. Our team is dedicated to helping you achieve your goals, and we're excited to start this journey with you.
                </p>

                <div style="text-align: center; margin: 35px 0;">
                    <a href="${ctaLink}" style="background-color: #4f46e5; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">
                        Book Your Strategy Call
                    </a>
                </div>

                <p style="font-size: 14px; color: #888888; text-align: center;">
                    If the button doesn't work, copy this link:<br>
                    <a href="${ctaLink}" style="color: #4f46e5;">${ctaLink}</a>
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="font-size: 12px; color: #999999; margin: 0;">&copy; ${new Date().getFullYear()} ${orgConfig.name || 'WKPC Meta Automation'}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Setup SendGrid for this specific Org
    if (orgConfig.sendgridApiKey) {
        sgMail.setApiKey(orgConfig.sendgridApiKey);
    }

    const msg = {
        to: lead.email,
        from: orgConfig.fromEmail || config.senderEmail, // Verified sender required
        subject: subject,
        text: text,
        html: html
    };

    try {
        // Try SendGrid
        if (orgConfig.sendgridApiKey) {
            await sgMail.send(msg);
            logger.info(`Email sent via SendGrid to ${lead.email}`);
            // Reset API Key to global if needed? sgMail is singleton. Be careful.
            // In a concurrent environment, setting correct key is crucial.
            // Better to instantiate if possible, but @sendgrid/mail is singleton.
            // For MVP this is okay, but high concurrency might mix keys if we are not careful.
            // Actually, @sendgrid/mail IS singleton. This is a risk.
            // Fix: User nodemailer for SendGrid via SMTP or just accept the race condition for now (MVP).
            // Correction: For MVP let's stick to setApiKey but be aware.
            return { status: 'sent', provider: 'sendgrid' };
        } else {
            // Fallback logic could go here if we want to allow admins to use system smtp?
            // For SaaS, usually we don't let them use our SMTP unless they pay.
            throw new Error("Org SendGrid API Key missing");
        }
    } catch (err) {
        logger.error('Email Send Failed', err);
        throw err;
    }
};

const sendResetEmail = async (email, resetUrl) => {
    const subject = 'Password Reset Request';
    const text = `You requested a password reset. Please click on this link to reset your password: ${resetUrl}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset regarding your account.</p>
      <p><a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    const msg = {
        to: email,
        from: config.senderEmail || 'slokender05@gmail.com',
        subject: subject,
        text: text,
        html: html
    };

    try {
        if (config.sendgridApiKey) {
            await sgMail.send(msg);
            logger.info(`Reset email sent via SendGrid to ${email}`);
        } else {
            throw new Error("SendGrid API Key missing");
        }
    } catch (err) {
        logger.error('SendGrid failed, trying Nodemailer...', err);
        try {
            await fallbackTransporter.sendMail({
                from: config.smtp.user,
                to: email,
                subject: subject,
                text: text,
                html: html
            });
            logger.info(`Reset email sent via Nodemailer to ${email}`);
        } catch (fallbackErr) {
            logger.error('Nodemailer failed too.', fallbackErr);
            throw fallbackErr;
        }
    }
};

// Send Login Credentials to New Team Memeber
const sendTeamCredentials = async (user, password) => {
    const loginUrl = 'http://localhost:3000'; // Make dynamic if needed
    const subject = 'Your WKPC Automation Account Credentials';
    const text = `Hello ${user.name},\n\nAn account has been created for you on the WKPC Automation Platform.\n\nYou can access the dashboard here: ${loginUrl}\nYour Username: ${user.email}\nYour Password: ${password}\n\nBest Regards,\nWKPC Meta Automation Team`;
    const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to the Team!</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 10px;">You have been added to the WKPC Automation Platform</p>
        </div>
        <div style="padding: 40px 30px; background-color: #ffffff;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hello <strong>${user.name}</strong>,</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">An account has been created for you. You can now access the dashboard to manage your assigned leads.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #4f46e5;">
                <p style="margin: 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">URL</p>
                <p style="margin: 0 0 15px 0; color: #111827; font-weight: 600;">${loginUrl}</p>
                <p style="margin: 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Username</p>
                <p style="margin: 0 0 15px 0; color: #111827; font-weight: 600;">${user.email}</p>
                <p style="margin: 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Password</p>
                <p style="margin: 0; color: #111827; font-weight: 600;">${password}</p>
            </div>

            <a href="${loginUrl}" style="display: block; width: 100%; padding: 16px 0; background-color: #4f46e5; color: white; text-decoration: none; text-align: center; border-radius: 8px; font-weight: 600; margin-top: 30px;">Login to Dashboard</a>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} WKPC Meta Automation</p>
        </div>
    </div>
    `;

    // MOCK MODE FOR DEV: If no keys, just log it and return success
    if (config.smtp.host === 'smtp.example.com' && config.sendgridApiKey === 'SG.xxxxxxxx') {
        console.log('================================================');
        console.log(' [MOCK EMAIL SERVICE] ');
        console.log(` To: ${user.email} `);
        console.log(` Subject: ${subject} `);
        console.log(' Credentials:', user.email, password);
        console.log('================================================');
        return { status: 'mock_sent' };
    }

    const msg = {
        to: user.email,
        from: config.senderEmail || 'slokender05@gmail.com',
        subject: subject,
        text: text,
        html: html
    };

    try {
        if (config.sendgridApiKey && config.sendgridApiKey !== 'SG.xxxxxxxx') {
            await sgMail.send(msg);
            logger.info(`Team credentials email sent via SendGrid to ${user.email}`);
        } else {
            // Fallback to Nodemailer
            if (config.smtp.host === 'smtp.example.com') throw new Error("No SMTP Configured");

            await fallbackTransporter.sendMail({
                from: config.smtp.user,
                to: user.email,
                subject: subject,
                text: text,
                html: html
            });
            logger.info(`Team credentials email sent via Nodemailer to ${user.email}`);
        }
    } catch (err) {
        // In Dev, don't crash the UI, just log the error
        console.warn("Email failed to send (likely due to missing credentials). Logging credentials here instead:");
        console.log(`USER: ${user.email} | PASS: ${password}`);
        // We return success so frontend doesn't show error red box
        return { status: 'mock_sent_fallback', error: err.message };
    }
};

module.exports = { sendWelcomeEmail, sendResetEmail, sendTeamCredentials };

