const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send admin notification email for new booking
 * @param {Object} bookingData - Complete booking data from database
 * @returns {Object} - Email sending result
 */
async function sendAdminBookingNotification(bookingData) {
  try {
    const {
      booking_number,
      first_name,
      last_name,
      email,
      phone,
      address,
      suburb,
      postcode,
      schedule_date,
      selected_service,
      serviceDetails,
      pricing,
      notes
    } = bookingData;

    // Validate required environment variables
    if (!process.env.SENDGRID_BUSINESS_EMAIL) {
      throw new Error('SENDGRID_BUSINESS_EMAIL environment variable is not set');
    }
    if (!process.env.SENDGRID_FROM_EMAIL) {
      throw new Error('SENDGRID_FROM_EMAIL environment variable is not set');
    }

    // Try SendGrid dynamic template first, fallback to HTML template
    const templateId = process.env.SENDGRID_ADMIN_BOOKING_TEMPLATE_ID;
    
    let emailData;
    
    if (templateId) {
      // Use SendGrid dynamic template
      emailData = {
        to: process.env.SENDGRID_BUSINESS_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        templateId: templateId,
        dynamicTemplateData: {
          // Booking Information
          booking_number,
          service_type: selected_service,
          
          // Customer Information
          customer_name: `${first_name} ${last_name}`,
          customer_email: email,
          customer_phone: phone,
          customer_address: address,
          suburb: suburb || 'Not specified',
          postcode: postcode || 'Not specified',
          
          // Service Details
          schedule_date: new Date(schedule_date).toLocaleDateString('en-AU', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          
          // Service-specific details
          service_details: formatServiceDetails(serviceDetails, selected_service),
          
          // Pricing
          total_price: pricing?.totalPrice ? `$${pricing.totalPrice.toFixed(2)}` : 'Price not calculated',
          pricing_breakdown: formatPricingBreakdown(pricing),
          
          // Additional Information
          notes: notes || 'No additional notes',
          
          // Company Information
          company_name: process.env.COMPANY_NAME || 'Cleaner Home',
          
          // Timestamps
          booking_created: new Date().toLocaleDateString('en-AU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      };
    } else {
      // Use HTML template with placeholder replacement
      const htmlContent = await generateHtmlEmail(bookingData);
      
      emailData = {
        to: process.env.SENDGRID_BUSINESS_EMAIL,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: `New Booking Created - ${booking_number}`,
        html: htmlContent
      };
    }

    const response = await sgMail.send(emailData);
    
    const messageId = response[0].headers['x-message-id'];
    const statusCode = response[0].statusCode;
    
    console.log('✅ Admin booking notification sent via SendGrid');

    return {
      success: true,
      messageId: messageId,
      statusCode: statusCode,
      email: process.env.SENDGRID_BUSINESS_EMAIL
    };

  } catch (error) {
    console.error('❌ Admin booking notification failed:', {
      to: process.env.SENDGRID_BUSINESS_EMAIL,
      bookingNumber: bookingData.booking_number,
      service: bookingData.selected_service,
      customer: `${bookingData.first_name} ${bookingData.last_name}`,
      error: error.message,
      response: error.response?.body,
      timestamp: new Date().toISOString()
    });
    
    return {
      success: false,
      error: error.message,
      response: error.response?.body
    };
  }
}

/**
 * Format service details for email template
 * @param {Object} serviceDetails - Service-specific details
 * @param {String} serviceType - Type of service
 * @returns {String} - Formatted service details
 */
function formatServiceDetails(serviceDetails, serviceType) {
  if (!serviceDetails) return 'No service details available';

  try {
    const details = typeof serviceDetails === 'string' ? JSON.parse(serviceDetails) : serviceDetails;
    
    switch (serviceType) {
      case 'Regular Cleaning':
        return `
          • Frequency: ${details.frequency || 'Not specified'}
          • Duration: ${details.duration || 'Not specified'} hours
          • Special Requests: ${details.specialRequests || details.special_requests || 'None'}
        `;
        
      case 'Once-off Cleaning':
        return `
          • Duration: ${details.duration || 'Not specified'} hours
          • Two Cleaners: ${details.twoCleaners || details.two_cleaners ? 'Yes' : 'No'}
          • Special Requests: ${details.specialRequests || details.special_requests || 'None'}
        `;
        
      case 'End of Lease Cleaning':
        return `
          • Home Size: ${details.homeSize || details.home_size || 'Not specified'}
          • Base Bathrooms: ${details.baseBathrooms || details.base_bathrooms || 0}
          • Extra Bathrooms: ${details.extraBathrooms || details.extra_bathrooms || 0}
          • Furnished: ${details.furnished ? 'Yes' : 'No'}
          • Pets: ${details.pets ? 'Yes' : 'No'}
          • Steam Carpet: ${details.steamCarpet || details.steam_carpet ? 'Yes' : 'No'}
          • Special Requests: ${details.specialRequests || details.special_requests || 'None'}
        `;
        
      case 'Airbnb Cleaning':
        return `
          • Service Type: ${details.serviceType || details.service_type || 'Not specified'}
          • Frequency: ${details.frequency || 'Not specified'}
          • Duration: ${details.duration || 'Not specified'} hours
          • Linen Change: ${details.linenChange || details.linen_change ? 'Yes' : 'No'}
          • Restock Amenities: ${details.restockAmenities || details.restock_amenities ? 'Yes' : 'No'}
          • Special Requests: ${details.specialRequests || details.special_requests || 'None'}
        `;
        
      case 'Commercial Cleaning':
        return `
          • Business Type: ${details.businessType || details.service_type || 'Not specified'}
          • Property Size: ${details.propertySize || 'Not specified'}
          • Cleaning Frequency: ${details.frequency || 'Not specified'}
          • Selected Hours: ${details.selectedHours || details.hours_per_visit || 'Not specified'} hours
          • Staff Count: ${details.staffCount || details.staff_count || 'Not specified'}
          • Preferred Time: ${details.preferredTime || details.preferred_time || 'Not specified'}
        `;
        
      case 'NDIS Cleaning':
        return `
          • NDIS Number: ${details.ndisNumber || 'Not provided'}
          • Plan Manager: ${details.planManager || 'Not provided'}
          • Frequency: ${details.frequency || 'Not specified'}
          • Duration: ${details.duration || 'Not specified'} hours
          • Special Requests: ${details.specialRequests || details.special_requests || 'None'}
        `;
        
      default:
        return JSON.stringify(details, null, 2);
    }
  } catch (error) {
    return 'Service details available but formatting failed';
  }
}

/**
 * Format pricing breakdown for email template
 * @param {Object} pricing - Pricing information
 * @returns {String} - Formatted pricing breakdown
 */
function formatPricingBreakdown(pricing) {
  if (!pricing) return 'No pricing information available';

  try {
    const breakdown = [];
    
    if (pricing.basePrice) {
      breakdown.push(`• Base Price: $${pricing.basePrice.toFixed(2)}`);
    }
    
    if (pricing.additionalFees && Object.keys(pricing.additionalFees).length > 0) {
      breakdown.push('• Additional Fees:');
      Object.entries(pricing.additionalFees).forEach(([key, value]) => {
        if (value > 0) {
          breakdown.push(`  - ${key}: $${value.toFixed(2)}`);
        }
      });
    }
    
    if (pricing.discounts && Object.keys(pricing.discounts).length > 0) {
      breakdown.push('• Discounts:');
      Object.entries(pricing.discounts).forEach(([key, value]) => {
        if (value > 0) {
          breakdown.push(`  - ${key}: -$${value.toFixed(2)}`);
        }
      });
    }
    
    if (pricing.totalPrice) {
      breakdown.push(`• Total Price: $${pricing.totalPrice.toFixed(2)}`);
    }
    
    return breakdown.length > 0 ? breakdown.join('\n') : 'No pricing breakdown available';
    
  } catch (error) {
    return 'Pricing breakdown available but formatting failed';
  }
}

/**
 * Generate HTML email content by replacing placeholders in template
 * @param {Object} bookingData - Complete booking data from database
 * @returns {String} - HTML email content
 */
async function generateHtmlEmail(bookingData) {
  const fs = require('fs').promises;
  const path = require('path');
  
  try {
    // Read the HTML template
    const templatePath = path.join(__dirname, 'template.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf8');
    
    const {
      booking_number,
      first_name,
      last_name,
      email,
      phone,
      address,
      suburb,
      postcode,
      schedule_date,
      selected_service,
      serviceDetails,
      pricing,
      notes,
      status = 'pending'
    } = bookingData;

    // Replace all placeholders
    const replacements = {
      'BOOKING_NUMBER_PLACEHOLDER': booking_number,
      'CUSTOMER_NAME_PLACEHOLDER': `${first_name} ${last_name}`,
      'CUSTOMER_EMAIL_PLACEHOLDER': email,
      'CUSTOMER_PHONE_PLACEHOLDER': phone,
      'SERVICE_TYPE_PLACEHOLDER': selected_service,
      'SCHEDULED_DATE_PLACEHOLDER': new Date(schedule_date).toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      'SERVICE_ADDRESS_PLACEHOLDER': `${address}, ${suburb || ''} ${postcode || ''}`.trim(),
      'BOOKING_DATE_PLACEHOLDER': new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'SERVICE_DETAILS_PLACEHOLDER': formatServiceDetails(serviceDetails, selected_service),
      'PRICING_DETAILS_PLACEHOLDER': formatPricingBreakdown(pricing),
      'TOTAL_PRICE_PLACEHOLDER': pricing?.totalPrice ? pricing.totalPrice.toFixed(2) : '0.00',
      'BOOKING_STATUS_PLACEHOLDER': status.charAt(0).toUpperCase() + status.slice(1)
    };

    // Replace all placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
    });

    return htmlTemplate;

  } catch (error) {
    // Return a simple fallback HTML
    return `
      <html>
        <body>
          <h2>New Booking Created</h2>
          <p><strong>Booking Number:</strong> ${bookingData.booking_number}</p>
          <p><strong>Customer:</strong> ${bookingData.first_name} ${bookingData.last_name}</p>
          <p><strong>Service:</strong> ${bookingData.selected_service}</p>
          <p><strong>Email:</strong> ${bookingData.email}</p>
          <p><strong>Phone:</strong> ${bookingData.phone}</p>
          <p><strong>Address:</strong> ${bookingData.address}</p>
          <p><strong>Schedule Date:</strong> ${new Date(bookingData.schedule_date).toLocaleDateString('en-AU')}</p>
        </body>
      </html>
    `;
  }
}

module.exports = {
  sendAdminBookingNotification,
  sendQuickBookingAdminNotification,
  sendQuickBookingCustomerConfirmation,
  sendBookingCustomerConfirmation,
  sendSubscriptionConfirmation,
  sendSubscriptionNotification,
  sendContactFormBusinessNotification,
  sendContactFormCustomerConfirmation
};

/**
 * Send admin notification for Quick-Book bookings
 * @param {{firstName:string,lastName:string,email:string,phone:string,address:string,date?:string,time?:string}} customerDetails
 * @param {{bookingId?:number,bookingNumber:string,serviceType:string,status?:string,createdAt?:string,totalPrice?:number,frequency?:string,minHours?:number,baseRate?:number,totalHours?:number}} bookingDetails
 */
async function sendQuickBookingAdminNotification(customerDetails, bookingDetails) {
  try {
    const templateId = process.env.SENDGRID_QUICK_BOOKING_ADMIN_TEMPLATE_ID;
    const toEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_BUSINESS_EMAIL;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (!toEmail || !fromEmail) throw new Error('Missing SENDGRID emails for quick-book admin');

    const msg = templateId ? {
      to: toEmail,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
        bookingNumber: bookingDetails.bookingNumber,
        serviceType: bookingDetails.serviceType,
        scheduledDate: customerDetails.date,
        scheduledTime: customerDetails.time,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        totalPrice: bookingDetails.totalPrice,
        address: customerDetails.address,
        bookingType: bookingDetails.bookingType,
        frequency: bookingDetails.frequency,
        minHours: bookingDetails.minHours,
        baseRate: bookingDetails.baseRate,
        totalHours: bookingDetails.totalHours
      }
    } : {
      to: toEmail,
      from: fromEmail,
      subject: `New Quick Booking #${bookingDetails.bookingNumber} - ${bookingDetails.serviceType}`,
      html: `
        <h2>New Quick Booking Received</h2>
        <p><strong>Booking #:</strong> ${bookingDetails.bookingNumber}</p>
        <p><strong>Service:</strong> ${bookingDetails.serviceType}</p>
        <p><strong>Customer:</strong> ${customerDetails.firstName} ${customerDetails.lastName}</p>
        <p><strong>Email:</strong> ${customerDetails.email}</p>
        <p><strong>Phone:</strong> ${customerDetails.phone}</p>
        <p><strong>Address:</strong> ${customerDetails.address}</p>
        <p><strong>Date/Time:</strong> ${customerDetails.date || '-'} ${customerDetails.time || ''}</p>
        <p><strong>Total Price:</strong> ${bookingDetails.totalPrice ?? '-'}</p>
      `
    };

    const response = await sgMail.send(msg);
    
    console.log('📧 Quick-book admin notification sent:', {
      to: toEmail,
      bookingNumber: bookingDetails.bookingNumber,
      service: bookingDetails.serviceType,
      messageId: response[0].headers['x-message-id']
    });
    
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Quick-book admin notification failed:', {
      bookingNumber: bookingDetails.bookingNumber,
      error: error.message
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Send customer confirmation for Quick-Book bookings
 * @param {{firstName:string,email:string,address?:string,date?:string,time?:string}} customerDetails
 * @param {{bookingNumber:string,serviceType:string,totalPrice?:number,frequency?:string,minHours?:number,baseRate?:number,totalHours?:number}} bookingDetails
 */
async function sendQuickBookingCustomerConfirmation(customerDetails, bookingDetails) {
  try {
    const templateId = process.env.SENDGRID_QUICK_BOOKING_CUSTOMER_TEMPLATE_ID;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) throw new Error('Missing SENDGRID_FROM_EMAIL for quick-book customer');

    const msg = templateId ? {
      to: customerDetails.email,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        customerName: customerDetails.firstName,
        bookingNumber: bookingDetails.bookingNumber,
        serviceType: bookingDetails.serviceType,
        frequency: bookingDetails.frequency,
        address: customerDetails.address,
        scheduledDate: customerDetails.date,
        scheduledTime: customerDetails.time,
        totalHours: bookingDetails.totalHours,
        totalPrice: bookingDetails.totalPrice,
        minHours: bookingDetails.minHours,
        baseRate: bookingDetails.baseRate,
        companyLogo: process.env.COMPANY_LOGO_URL,
        companyEmail: process.env.COMPANY_EMAIL || fromEmail,
        companyPhone: process.env.COMPANY_PHONE,
        operatingHours: process.env.COMPANY_OPERATING_HOURS
      }
    } : {
      to: customerDetails.email,
      from: fromEmail,
      subject: `Quick Booking Confirmation - ${bookingDetails.serviceType} #${bookingDetails.bookingNumber}`,
      html: `
        <h2>Booking Confirmed</h2>
        <p>Hi ${customerDetails.firstName}, thanks for booking with us.</p>
        <p><strong>Booking #:</strong> ${bookingDetails.bookingNumber}</p>
        <p><strong>Service:</strong> ${bookingDetails.serviceType}</p>
        <p><strong>Date/Time:</strong> ${customerDetails.date || '-'} ${customerDetails.time || ''}</p>
        <p><strong>Address:</strong> ${customerDetails.address || '-'}</p>
        <p><strong>Total:</strong> ${bookingDetails.totalPrice ?? '-'}</p>
      `
    };

    const response = await sgMail.send(msg);
    
    console.log('📧 Quick-book customer confirmation sent');
    
    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error) {
    console.error('❌ Quick-book customer confirmation failed');
    
    return { success: false, error: error.message };
  }
}

/**
 * Send customer confirmation for a full booking (non quick-book)
 * @param {{first_name:string,last_name?:string,email:string,address?:string,schedule_date?:string}} customer
 * @param {{booking_number:string,selected_service:string,totalPrice?:number}} booking
 */
async function sendBookingCustomerConfirmation(customer, booking) {
  try {
    const templateId = process.env.SENDGRID_CUSTOMER_BOOKING_TEMPLATE_ID;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    
    if (!fromEmail) {
      throw new Error('Missing SENDGRID_FROM_EMAIL for booking customer');
    }

    // Format scheduled date
    const formattedDate = customer.schedule_date 
      ? new Date(customer.schedule_date).toLocaleDateString('en-AU', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Not specified';

    // Format total price
    const formattedPrice = booking.totalPrice 
      ? `$${Number(booking.totalPrice).toFixed(2)}`
      : 'To be confirmed';

    const msg = templateId ? {
      to: customer.email,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        customerName: `${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}`,
        bookingNumber: booking.booking_number,
        serviceType: booking.selected_service,
        scheduledDate: formattedDate,
        totalPrice: formattedPrice,
        address: customer.address || 'Not specified',
        companyLogo: process.env.COMPANY_LOGO_URL || '',
        companyEmail: process.env.COMPANY_EMAIL || fromEmail,
        companyPhone: process.env.COMPANY_PHONE || ''
      }
    } : {
      to: customer.email,
      from: fromEmail,
      subject: `Booking Confirmation - ${booking.selected_service} #${booking.booking_number}`,
      html: `
        <h2>Booking Confirmed</h2>
        <p>Hi ${customer.first_name}${customer.last_name ? ' ' + customer.last_name : ''}, thanks for booking with us.</p>
        <p><strong>Booking #:</strong> ${booking.booking_number}</p>
        <p><strong>Service:</strong> ${booking.selected_service}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Address:</strong> ${customer.address || 'Not specified'}</p>
        <p><strong>Total:</strong> ${formattedPrice}</p>
      `
    };

    console.log('📤 Sending customer confirmation to:', customer.email);
    
    const response = await sgMail.send(msg);
    const messageId = response[0].headers['x-message-id'];
    
    console.log('✅ Booking customer confirmation sent via SendGrid', {
      to: customer.email,
      bookingNumber: booking.booking_number,
      messageId
    });
    
    return { success: true, messageId: messageId };
  } catch (error) {
    console.error('❌ Booking customer confirmation failed:', {
      to: customer.email,
      bookingNumber: booking.booking_number,
      error: error.message,
      response: error.response?.body
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Send subscription confirmation to customer
 * @param {{email:string}} param0
 */
async function sendSubscriptionConfirmation({ email }) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) throw new Error('Missing SENDGRID_FROM_EMAIL for subscription');
    const templateId = process.env.SENDGRID_SUBSCRIPTION_CUSTOMER_TEMPLATE_ID;

    const msg = templateId ? {
      to: email,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        company_name: process.env.COMPANY_NAME,
        submission_date: new Date().toLocaleString()
      }
    } : {
      to: email,
      from: fromEmail,
      subject: 'Subscription Confirmed',
      html: '<p>Thanks for subscribing. We will keep you updated.</p>'
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers['x-message-id'];
    
    console.log('📧 Subscription confirmation email sent via SendGrid');
    
    return { success: true, messageId: messageId };
  } catch (error) {
    console.error('❌ Subscription confirmation email failed');
    return { success: false, error: error.message };
  }
}

/**
 * Notify business of a new subscription
 * @param {{email:string}} param0
 */
async function sendSubscriptionNotification({ email }) {
  try {
    const toEmail = process.env.SENDGRID_BUSINESS_EMAIL;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!toEmail || !fromEmail) throw new Error('Missing SENDGRID emails for subscription notification');
    const templateId = process.env.SENDGRID_SUBSCRIPTION_BUSINESS_TEMPLATE_ID;

    const msg = templateId ? {
      to: toEmail,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        company_name: process.env.COMPANY_NAME,
        subscriber_email: email,
        submission_date: new Date().toLocaleString()
      }
    } : {
      to: toEmail,
      from: fromEmail,
      subject: 'New Subscriber',
      html: `<p>New subscription from: <strong>${email}</strong></p>`
    };

    const response = await sgMail.send(msg);
    const messageId = response[0].headers['x-message-id'];
    
    console.log('📧 Subscription business notification sent via SendGrid');
    
    return { success: true, messageId: messageId };
  } catch (error) {
    console.error('❌ Subscription business notification failed');
    return { success: false, error: error.message };
  }
}

/**
 * Notify business of a new contact form submission
 * @param {{name:string,email:string,phone?:string,address?:string,subject:string,message:string}} contact
 */
async function sendContactFormBusinessNotification(contact) {
  try {
    const toEmail = process.env.SENDGRID_BUSINESS_EMAIL;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!toEmail || !fromEmail) throw new Error('Missing SENDGRID emails for contact business');
    const templateId = process.env.SENDGRID_CONTACT_BUSINESS_TEMPLATE_ID;

    const msg = templateId ? {
      to: toEmail,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        company_name: process.env.COMPANY_NAME,
        customer_name: contact.name,
        customer_email: contact.email,
        customer_phone: contact.phone,
        customer_address: contact.address || 'Not provided',
        subject: contact.subject,
        message: contact.message,
        submission_date: new Date().toLocaleString()
      }
    } : {
      to: toEmail,
      from: fromEmail,
      subject: `New Contact: ${contact.subject}`,
      html: `
        <h3>New contact submission</h3>
        <p><strong>Name:</strong> ${contact.name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Phone:</strong> ${contact.phone || '-'}</p>
        <p><strong>Address:</strong> ${contact.address || '-'}</p>
        <p><strong>Message:</strong><br/>${contact.message}</p>
      `
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send contact form confirmation to customer
 * @param {{name:string,email:string,subject:string}} contact
 */
async function sendContactFormCustomerConfirmation(contact) {
  try {
    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) throw new Error('Missing SENDGRID_FROM_EMAIL for contact customer');
    const templateId = process.env.SENDGRID_CONTACT_CUSTOMER_TEMPLATE_ID;

    const msg = templateId ? {
      to: contact.email,
      from: fromEmail,
      templateId,
      dynamicTemplateData: {
        company_name: process.env.COMPANY_NAME,
        customer_name: contact.name,
        subject: contact.subject,
        submission_date: new Date().toLocaleString()
      }
    } : {
      to: contact.email,
      from: fromEmail,
      subject: 'We received your message',
      html: `<p>Hi ${contact.name}, thanks for contacting us. We will get back to you shortly.</p>`
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
