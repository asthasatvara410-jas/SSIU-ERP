/**
 * Centralized Indian Number & Currency Formatter
 * Compliant with Swarrnim Startup & Innovation University financial standards.
 *
 * Ensures:
 * - Proper Indian comma grouping (e.g. 1,00,000 / 10,00,000 / 1,00,00,000)
 * - Zero unwanted character/digit spacing in both DOM and PDF vector outputs
 * - Deterministic decimal precision support
 */

export function formatIndianNumber(
  value: number | string | null | undefined,
  precision?: number
): string {
  if (value === null || value === undefined || value === '') return '0';
  const strVal = String(value).replace(/,/g, '').trim();
  const num = parseFloat(strVal);
  if (isNaN(num)) return '0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let formattedNumStr: string;
  if (typeof precision === 'number') {
    formattedNumStr = absNum.toFixed(precision);
  } else if (strVal.includes('.')) {
    // Preserve string decimal if passed as formatted string e.g. "1250.50"
    const rawDecimals = strVal.split('.')[1];
    formattedNumStr = `${Math.floor(absNum)}.${rawDecimals}`;
  } else {
    formattedNumStr = absNum.toString();
  }

  const parts = formattedNumStr.split('.');
  let integerPart = parts[0];
  const decimalPart = parts.length > 1 ? '.' + parts[1] : '';

  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  return (isNegative ? '-' : '') + integerPart + decimalPart;
}

export function formatIndianCurrency(
  value: number | string | null | undefined,
  symbol: string = '₹'
): string {
  const formatted = formatIndianNumber(value);
  return `${symbol}${formatted}`;
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

function convertIntegerToWords(num: number): string {
  if (num === 0) return 'Zero';

  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    words += (crore > 99 ? convertIntegerToWords(crore) : convertBelowThousand(crore)) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertBelowThousand(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertBelowThousand(thousand) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertBelowThousand(remainder) + ' ';
  }

  return words.trim();
}

/**
 * Converts numeric amount to Indian Currency words
 * e.g. 5000 -> "Rupees Five Thousand Only"
 *      1250.50 -> "Rupees One Thousand Two Hundred Fifty and Fifty Paise Only"
 */
export function amountToWords(
  amount: number | string | null | undefined
): string {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '').trim()) : amount;
  if (isNaN(num) || num === 0) {
    return 'Rupees Zero Only';
  }

  const absNum = Math.abs(num);
  const rupees = Math.floor(absNum);
  const paise = Math.round((absNum - rupees) * 100);

  let result = '';
  const rupeesWords = rupees > 0 ? convertIntegerToWords(rupees) : 'Zero';

  if (paise > 0) {
    const paiseWords = convertBelowThousand(paise);
    if (rupees > 0) {
      result = `Rupees ${rupeesWords} and ${paiseWords} Paise Only`;
    } else {
      result = `${paiseWords} Paise Only`;
    }
  } else {
    result = `Rupees ${rupeesWords} Only`;
  }

  return result.replace(/\s+/g, ' ').trim();
}

