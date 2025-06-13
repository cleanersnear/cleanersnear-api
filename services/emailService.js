import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const emailService = {
    async sendBusinessNotification(enquiryData) {
        try {
            await sgMail.send({
                to: process.env.SENDGRID_BUSINESS_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_QUICKENQUIRY_BUSINESS_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    enquiry_type: 'Quick Enquiry',
                    customer_name: enquiryData.name,
                    customer_email: enquiryData.email,
                    customer_phone: enquiryData.phone,
                    customer_address: enquiryData.address,
                    service_type: enquiryData.service,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Business notification email sent');
        } catch (error) {
            console.error('Error sending business notification:', error);
            throw error;
        }
    },

    async sendCustomerConfirmation(enquiryData) {
        try {
            await sgMail.send({
                to: enquiryData.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_QUICKENQUIRY_CUSTOMER_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    customer_name: enquiryData.name,
                    service_type: enquiryData.service,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Customer confirmation email sent');
        } catch (error) {
            console.error('Error sending customer confirmation:', error);
            throw error;
        }
    },

    async sendCostCalculatorBusinessNotification(calculatorData) {
        try {
            await sgMail.send({
                to: process.env.SENDGRID_BUSINESS_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_COST_CALCULATOR_BUSINESS_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    enquiry_type: 'Cost Calculator',
                    customer_name: calculatorData.name,
                    customer_email: calculatorData.email,
                    customer_phone: calculatorData.phone,
                    customer_address: calculatorData.address,
                    service_type: calculatorData.service,
                    clean_type: calculatorData.typeOfClean,
                    notes: calculatorData.notes || 'No additional notes',
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Cost calculator business notification sent');
        } catch (error) {
            console.error('Error sending cost calculator business notification:', error);
            throw error;
        }
    },

    async sendCostCalculatorCustomerConfirmation(calculatorData) {
        try {
            await sgMail.send({
                to: calculatorData.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_COST_CALCULATOR_CUSTOMER_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    customer_name: calculatorData.name,
                    service_type: calculatorData.service,
                    clean_type: calculatorData.typeOfClean,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Cost calculator customer confirmation sent');
        } catch (error) {
            console.error('Error sending cost calculator customer confirmation:', error);
            throw error;
        }
    },

    async sendSubscriptionConfirmation({ email }) {
        try {
            await sgMail.send({
                to: email,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_SUBSCRIPTION_CUSTOMER_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Subscription confirmation sent');
        } catch (error) {
            console.error('Error sending subscription confirmation:', error);
            throw error;
        }
    },

    async sendSubscriptionNotification({ email }) {
        try {
            await sgMail.send({
                to: process.env.SENDGRID_BUSINESS_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_SUBSCRIPTION_BUSINESS_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    subscriber_email: email,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Subscription notification sent');
        } catch (error) {
            console.error('Error sending subscription notification:', error);
            throw error;
        }
    },

    async sendContactFormBusinessNotification(contactData) {
        try {
            await sgMail.send({
                to: process.env.SENDGRID_BUSINESS_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_CONTACT_BUSINESS_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    customer_name: contactData.name,
                    customer_email: contactData.email,
                    customer_phone: contactData.phone,
                    customer_address: contactData.address || 'Not provided',
                    subject: contactData.subject,
                    message: contactData.message,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Contact form business notification sent');
        } catch (error) {
            console.error('Error sending contact form business notification:', error);
            throw error;
        }
    },

    async sendContactFormCustomerConfirmation(contactData) {
        try {
            await sgMail.send({
                to: contactData.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_CONTACT_CUSTOMER_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    customer_name: contactData.name,
                    subject: contactData.subject,
                    submission_date: new Date().toLocaleString()
                }
            });
            console.log('Contact form customer confirmation sent');
        } catch (error) {
            console.error('Error sending contact form customer confirmation:', error);
            throw error;
        }
    },

    async sendQuoteBusinessNotification(quoteData) {
        try {
            await sgMail.send({
                to: process.env.SENDGRID_BUSINESS_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_QUOTE_BUSINESS_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    // Service Details
                    serviceType: quoteData.serviceType || 'Not specified',
                    cleaningType: quoteData.cleaningType || 'Not specified',
                    frequency: quoteData.frequency || 'Not specified',
                    
                    // Property Details
                    propertyType: quoteData.propertyType || 'Not specified',
                    bedrooms: quoteData.bedrooms || 'Not specified',
                    bathrooms: quoteData.bathrooms || 'Not specified',
                    rateType: quoteData.rateType || 'Not specified',
                    
                    // Schedule
                    preferredDate: quoteData.preferredDate || 'Not specified',
                    preferredTime: quoteData.preferredTime || 'Not specified',
                    parkingAvailable: quoteData.parkingAvailable || 'Not specified',
                    access: quoteData.access || 'Not specified',
                    
                    // Customer Details
                    customerName: quoteData.name,
                    customerCompany: quoteData.companyName || 'Not specified',
                    customerEmail: quoteData.email,
                    customerPhone: quoteData.phone,
                    customerAddress: quoteData.streetAddress,
                    customerSuburb: quoteData.suburb,
                    customerState: quoteData.state,
                    customerPostcode: quoteData.postCode,
                    customerNotes: quoteData.notes || 'No notes provided',
                    
                    // Metadata
                    submissionDate: new Date().toLocaleString()
                }
            });
            console.log('Quote business notification sent');
        } catch (error) {
            console.error('Error sending quote business notification:', error);
            throw error;
        }
    },

    async sendQuoteCustomerConfirmation(quoteData) {
        try {
            await sgMail.send({
                to: quoteData.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                templateId: process.env.SENDGRID_QUOTE_CUSTOMER_TEMPLATE_ID,
                dynamicTemplateData: {
                    company_name: process.env.COMPANY_NAME,
                    customerName: quoteData.name,
                    serviceType: quoteData.serviceType || 'Not specified',
                    cleaningType: quoteData.cleaningType || 'Not specified',
                    preferredDate: quoteData.preferredDate || 'Not specified',
                    preferredTime: quoteData.preferredTime || 'Not specified',
                    submissionDate: new Date().toLocaleString(),
                    quoteReference: `Q${Date.now().toString().slice(-6)}` // Generate a simple reference number
                }
            });
            console.log('Quote customer confirmation sent');
        } catch (error) {
            console.error('Error sending quote customer confirmation:', error);
            throw error;
        }
    },

    async sendBookingAdminNotification(customerDetails, bookingDetails) {
        try {
            await sgMail.send({
                to: process.env.ADMIN_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: `New Booking #${bookingDetails.bookingNumber} - ${bookingDetails.serviceType}`,
                templateId: process.env.SENDGRID_ADMIN_BOOKING_TEMPLATE_ID,
                dynamicTemplateData: {
                    customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
                    bookingNumber: bookingDetails.bookingNumber,
                    serviceType: bookingDetails.serviceType,
                    scheduledDate: customerDetails.date,
                    scheduledTime: customerDetails.time,
                    customerEmail: customerDetails.email,
                    customerPhone: customerDetails.phone,
                    totalPrice: bookingDetails.totalPrice
                }
            });
            console.log('Admin booking notification sent');
        } catch (error) {
            console.error('Error sending admin booking notification:', error);
            throw error;
        }
    },

    async sendBookingCustomerConfirmation(customerDetails, bookingDetails) {
        try {
            await sgMail.send({
                to: customerDetails.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: `Booking Confirmation - ${bookingDetails.serviceType} Service #${bookingDetails.bookingNumber}`,
                templateId: process.env.SENDGRID_CUSTOMER_BOOKING_TEMPLATE_ID,
                dynamicTemplateData: {
                    customerName: customerDetails.firstName,
                    bookingNumber: bookingDetails.bookingNumber,
                    serviceType: bookingDetails.serviceType,
                    scheduledDate: customerDetails.date,
                    scheduledTime: customerDetails.time,
                    totalPrice: bookingDetails.totalPrice,
                    address: customerDetails.address
                }
            });
            console.log('Customer booking confirmation sent');
        } catch (error) {
            console.error('Error sending customer booking confirmation:', error);
            throw error;
        }
    },

    async sendQuickBookingAdminNotification(customerDetails, bookingDetails) {
        try {
            await sgMail.send({
                to: process.env.ADMIN_EMAIL,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: `New Quick Booking #${bookingDetails.bookingNumber} - ${bookingDetails.serviceType}`,
                templateId: process.env.SENDGRID_QUICK_BOOKING_ADMIN_TEMPLATE_ID,
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
                    minAmount: bookingDetails.minAmount,
                    baseRate: bookingDetails.baseRate,
                    extraHours: bookingDetails.extraHours,
                    totalHours: bookingDetails.totalHours
                }
            });
            console.log('Quick booking admin notification sent');
        } catch (error) {
            console.error('Error sending quick booking admin notification:', error);
            throw error;
        }
    },

    async sendQuickBookingCustomerConfirmation(customerDetails, bookingDetails) {
        try {
            await sgMail.send({
                to: customerDetails.email,
                from: process.env.SENDGRID_FROM_EMAIL,
                subject: `Quick Booking Confirmation - ${bookingDetails.serviceType} Service #${bookingDetails.bookingNumber}`,
                templateId: process.env.SENDGRID_QUICK_BOOKING_CUSTOMER_TEMPLATE_ID,
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
                    // Company details
                    companyLogo: process.env.COMPANY_LOGO_URL,
                    companyEmail: process.env.COMPANY_EMAIL,
                    companyPhone: process.env.COMPANY_PHONE,
                    operatingHours: process.env.COMPANY_OPERATING_HOURS
                }
            });
            console.log('Quick booking customer confirmation sent');
        } catch (error) {
            console.error('Error sending quick booking customer confirmation:', error);
            throw error;
        }
    }
}; 