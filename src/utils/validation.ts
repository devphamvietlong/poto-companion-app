// Validation Utilities

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supports standard VN mobile numbers (0 or +84 followed by 9 digits)
export const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
// Minimum 8 characters, at least one letter and one number
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

export const isValidEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
};

export const isValidPhone = (phone: string): boolean => {
    return PHONE_REGEX.test(phone);
};

export const isValidPassword = (password: string): boolean => {
    return PASSWORD_REGEX.test(password);
};

export const validateRegisterInput = (identifier: string, password: string): { valid: boolean, error?: string } => {
    if (!identifier) return { valid: false, error: 'Identifier is required' };
    if (!password) return { valid: false, error: 'Password is required' };

    const isEmail = isValidEmail(identifier);
    const isPhone = isValidPhone(identifier);

    if (!isEmail && !isPhone) {
        return { valid: false, error: 'Invalid email or phone number format' };
    }

    if (!isValidPassword(password)) {
        return { valid: false, error: 'Password must be at least 8 chars, incl. 1 letter & 1 number' };
    }

    return { valid: true };
};
