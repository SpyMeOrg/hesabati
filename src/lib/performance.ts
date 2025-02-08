import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// منع إعادة التصيير غير الضروري
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// تخزين مؤقت للبيانات
export function useMemoryCache<T>(key: string, getData: () => Promise<T>, ttl: number = 5 * 60 * 1000) {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());

  const fetchData = useCallback(async () => {
    const now = Date.now();
    const cached = cache.current.get(key);

    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    const data = await getData();
    cache.current.set(key, { data, timestamp: now });
    return data;
  }, [key, getData, ttl]);

  return fetchData;
}

// تحسين الأداء للقوائم الطويلة
export function useVirtualList<T>(items: T[], itemHeight: number, containerHeight: number) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    return items.slice(start, start + visibleCount + 1);
  }, [items, scrollTop, itemHeight, containerHeight]);

  const totalHeight = items.length * itemHeight;
  const offsetY = Math.floor(scrollTop / itemHeight) * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (e: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

// تأخير تنفيذ الدالة
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// تحسين أداء النماذج
export function useFormValidation<T extends object>(
  initialValues: T,
  validate: (values: T) => Partial<Record<keyof T, string>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debouncedValidate = useCallback(
    debounce((values: T) => {
      setErrors(validate(values));
    }, 500),
    [validate]
  );

  useEffect(() => {
    if (!isSubmitting) {
      debouncedValidate(values);
    }
  }, [values, isSubmitting]);

  return {
    values,
    errors,
    isSubmitting,
    setValues,
    setIsSubmitting,
  };
}
