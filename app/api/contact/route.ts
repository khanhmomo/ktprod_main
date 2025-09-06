import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password for better security
  },
});

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate the input
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required fields' },
        { status: 400 }
      );
    }

    // Generate a 6-digit case ID
    const caseId = Math.floor(100000 + Math.random() * 900000);
    
    // Send notification email to admin
    await transporter.sendMail({
      from: `"${name}" <${process.env.GMAIL_EMAIL}>`,
      to: process.env.CONTACT_FORM_RECIPIENT || 'thewildstudio.nt@gmail.com',
      replyTo: email,
      subject: subject ? `[${caseId}] ${name} - ${subject}` : `[${caseId}] New Inquiry from ${name}`,
      text: message,
      html: `
        <h2>Case: ${caseId}</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    });

    // Send confirmation email to the user
    await transporter.sendMail({
      from: `"KhanhTran Production" <${process.env.GMAIL_EMAIL}>`,
      to: email,
      subject: `[Case ${caseId}] We've Received Your Inquiry`,
      text: `
        Dear ${name},

        Thank you for reaching out to KT Production! We've received your inquiry and our team will get back to you as soon as possible.

        Your case ID is: ${caseId}
        ${subject ? `Subject: ${subject}` : ''}
        
        ---
        
        For your reference, here's a copy of your message:
        ${message}
        
        ---
        
        If you need immediate assistance, please don't hesitate to contact us directly at:
        
        📞 Phone: (832) 992-7879
        📧 Email: khanhtranproduction@gmail.com
        📍 Location: D5/20-21 KDC Long Thinh, Hung Phu, Can Tho, Vietnam
        
        We appreciate your patience and look forward to assisting you!
        
        Best regards,
        KhanhTran Production Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank You for Contacting KT Production!</h2>
          
          <p>Dear ${name},</p>
          
          <p>We've received your inquiry and our team will get back to you as soon as possible.</p>
          
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Case ID:</strong> ${caseId}</p>
            ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
          </div>
          
          <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #ddd; margin: 20px 0;">
            <p><strong>Your Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px;">
            <h3 style="margin-top: 0;">Our Contact Information</h3>
            <p>📞 <strong>Phone:</strong> <a href="tel:8329927879">(832) 992-7879</a></p>
            <p>📧 <strong>Email:</strong> <a href="mailto:thewildstudio.nt@gmail.com">khanhtranproduction@gmail.com</a></p>
            <p>📍 <strong>Location:</strong> D5/20-21 KDC Long Thinh, Hung Phu, Can Tho, Vietnam</p>
          </div>
          
          <p>We appreciate your patience and look forward to assisting you!</p>
          
          <p>Best regards,<br>KT Production Team</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}
