// Utility function to clean data for Firestore (removes undefined values)
export const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore).filter(item => item !== undefined);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = cleanForFirestore(obj[key]);
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
  
  return obj;
};

// Helper to ensure required fields are present and valid
export const validateFirestoreData = (data: any, requiredFields: string[] = []): boolean => {
  if (!data || typeof data !== 'object') {
    return false;
  }

  for (const field of requiredFields) {
    if (!(field in data) || data[field] === undefined || data[field] === null) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }
  }

  return true;
};