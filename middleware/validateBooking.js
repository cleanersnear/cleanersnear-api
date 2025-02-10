export const validateCarpetCleaningBooking = (req, res, next) => {
    const { customerDetails, serviceDetails, carpetCleaningDetails } = req.body;
    
    // Add validation logic
    
    next();
}; 