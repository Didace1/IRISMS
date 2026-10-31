// src/shared/utils/formatters.js

/**
 * Format number with thousand separators
 * @param {number|string} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 0)
 * @returns {string} Formatted number with commas
 */
export const formatNumber = (value, decimals = 0) => {
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Format currency in RWF
 * @param {number|string} value - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: false)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, showDecimals = false) => {
  const num = Number(value);
  if (isNaN(num)) return '0 RWF';
  const decimals = showDecimals ? 2 : 0;
  return `${formatNumber(num, decimals)} RWF`;
};

/**
 * Format percentage
 * @param {number|string} value - The percentage value
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  const num = Number(value);
  if (isNaN(num)) return '0%';
  return `${num.toFixed(decimals)}%`;
};

/**
 * Format date to readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit' 
  });
};

/**
 * Format date and time
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};
