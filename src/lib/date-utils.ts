import { format } from "date-fns";
import { ar } from "date-fns/locale";

const arabicMonths = {
  "01": "يناير",
  "02": "فبراير",
  "03": "مارس",
  "04": "أبريل",
  "05": "مايو",
  "06": "يونيو",
  "07": "يوليو",
  "08": "أغسطس",
  "09": "سبتمبر",
  "10": "أكتوبر",
  "11": "نوفمبر",
  "12": "ديسمبر"
};

export function formatDate(date: string | Date | undefined) {
  if (!date) return "-";
  
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const year = dateObj.getFullYear();
  
  return `${day} ${arabicMonths[month]} ${year}`;
}
