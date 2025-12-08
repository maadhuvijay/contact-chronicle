/**
 * Formats a date string or Date object to MM-YY format
 * @param date - Date string or Date object
 * @returns Formatted date string in MM-YY format, or empty string if invalid
 */
export function formatDateToMMYY(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  // If it's already a Date object, use it
  if (date instanceof Date) {
    dateObj = date;
  } else {
    // Try to parse the string as a date
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Format as MM-YY
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = String(dateObj.getFullYear()).slice(-2);
  
  return `${month}-${year}`;
}

/**
 * Formats a Date object to MM-YY format (for use with Date objects directly)
 * @param date - Date object
 * @returns Formatted date string in MM-YY format
 */
export function formatDateObjectToMMYY(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return '';
  }
  
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  
  return `${month}-${year}`;
}

/**
 * Formats a date string or Date object to full date format (MM/DD/YYYY)
 * @param date - Date string or Date object
 * @returns Formatted date string in MM/DD/YYYY format, or original string if invalid
 */
export function formatDateToFull(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  // If it's already a Date object, use it
  if (date instanceof Date) {
    dateObj = date;
  } else {
    // Try to parse the string as a date
    dateObj = new Date(date);
  }
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    // If invalid, return original string if it's a string, otherwise empty
    return typeof date === 'string' ? date : '';
  }
  
  // Format as MM/DD/YYYY
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const year = String(dateObj.getFullYear());
  
  return `${month}/${day}/${year}`;
}

