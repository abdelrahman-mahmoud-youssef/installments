import { useMemo, useState } from 'react';
import { CalculationMethod, CreateContractInput, RecurrenceType } from '@/api/contracts';
import { shiftIsoDateByMonths } from '@/lib/calendar';
import { MAX_CONTRACT_TAG_LENGTH, MAX_PRODUCT_NAME_LENGTH } from '@/lib/contract-rules';
import {
  parseAmountInput,
  parseCountInput,
  parseNonNegativeAmountInput,
  todayIsoDate,
  toMinorUnits,
} from '@/lib/format';
import { PickedImage } from '@/lib/image-picker';
import { calculateSchedulePreview, SchedulePreview } from '@/lib/installment-schedule';

const DEFAULT_INSTALLMENT_COUNT = '12';

export interface SelectedCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface ContractFormValues {
  customer: SelectedCustomer | null;
  productName: string;
  tag: string;
  productPrice: string;
  downPayment: string;
  costPrice: string;
  image: PickedImage | null;
  calculationMethod: CalculationMethod;
  markupPercent: string;
  installmentCount: string;
  fixedInstallmentAmount: string;
  recurrenceType: RecurrenceType;
  intervalDays: string;
  startDate: string;
  firstPaymentDate: string;
}

export type ContractFormField =
  | 'customer'
  | 'productName'
  | 'tag'
  | 'productPrice'
  | 'downPayment'
  | 'costPrice'
  | 'markupPercent'
  | 'installmentCount'
  | 'fixedInstallmentAmount'
  | 'intervalDays'
  | 'schedule';

export type ContractFormErrorCode = 'required' | 'invalidAmount' | 'invalidCount' | 'tooLong' | 'nothingToFinance';

function initialValues(customer: SelectedCustomer | null): ContractFormValues {
  const today = todayIsoDate();
  return {
    customer,
    productName: '',
    tag: '',
    productPrice: '',
    downPayment: '',
    costPrice: '',
    image: null,
    calculationMethod: 'FIXED_COUNT',
    markupPercent: '',
    installmentCount: DEFAULT_INSTALLMENT_COUNT,
    fixedInstallmentAmount: '',
    recurrenceType: 'MONTHLY',
    intervalDays: '',
    startDate: today,
    firstPaymentDate: shiftIsoDateByMonths(today, 1),
  };
}

function parseOptionalAmount(text: string): number | null {
  return text.trim() ? parseNonNegativeAmountInput(text) : 0;
}

interface ParsedNumbers {
  productPrice: number | null;
  downPayment: number | null;
  costPrice: number | null;
  markupPercent: number | null;
  installmentCount: number | null;
  fixedInstallmentAmount: number | null;
  intervalDays: number | null;
}

function parseNumbers(values: ContractFormValues): ParsedNumbers {
  return {
    productPrice: parseAmountInput(values.productPrice),
    downPayment: parseOptionalAmount(values.downPayment),
    costPrice: parseOptionalAmount(values.costPrice),
    markupPercent: parseAmountInput(values.markupPercent),
    installmentCount: parseCountInput(values.installmentCount),
    fixedInstallmentAmount: parseAmountInput(values.fixedInstallmentAmount),
    intervalDays: parseCountInput(values.intervalDays),
  };
}

function buildPreview(values: ContractFormValues, numbers: ParsedNumbers): SchedulePreview | null {
  if (numbers.productPrice === null || numbers.downPayment === null) {
    return null;
  }
  return calculateSchedulePreview({
    calculationMethod: values.calculationMethod,
    productPrice: toMinorUnits(numbers.productPrice),
    downPayment: toMinorUnits(numbers.downPayment),
    markupPercent: numbers.markupPercent ?? undefined,
    installmentCount: numbers.installmentCount ?? undefined,
    fixedInstallmentAmount:
      numbers.fixedInstallmentAmount !== null ? toMinorUnits(numbers.fixedInstallmentAmount) : undefined,
  });
}

function validate(
  values: ContractFormValues,
  numbers: ParsedNumbers,
  preview: SchedulePreview | null,
): Partial<Record<ContractFormField, ContractFormErrorCode>> {
  const method = values.calculationMethod;
  const errors: Partial<Record<ContractFormField, ContractFormErrorCode>> = {};
  if (!values.customer) {
    errors.customer = 'required';
  }
  if (!values.productName.trim()) {
    errors.productName = 'required';
  } else if (values.productName.trim().length > MAX_PRODUCT_NAME_LENGTH) {
    errors.productName = 'tooLong';
  }
  if (values.tag.trim().length > MAX_CONTRACT_TAG_LENGTH) {
    errors.tag = 'tooLong';
  }
  if (numbers.productPrice === null) {
    errors.productPrice = 'invalidAmount';
  }
  if (numbers.downPayment === null) {
    errors.downPayment = 'invalidAmount';
  }
  if (numbers.costPrice === null) {
    errors.costPrice = 'invalidAmount';
  }
  if (method === 'MARKUP_PERCENT' && numbers.markupPercent === null) {
    errors.markupPercent = 'invalidAmount';
  }
  if (method !== 'FIXED_AMOUNT' && numbers.installmentCount === null) {
    errors.installmentCount = 'invalidCount';
  }
  if (method === 'FIXED_AMOUNT' && numbers.fixedInstallmentAmount === null) {
    errors.fixedInstallmentAmount = 'invalidAmount';
  }
  if (values.recurrenceType === 'EVERY_X_DAYS' && numbers.intervalDays === null) {
    errors.intervalDays = 'invalidCount';
  }
  if (Object.keys(errors).length === 0 && !preview) {
    errors.schedule = 'nothingToFinance';
  }
  return errors;
}

function buildPayload(values: ContractFormValues, numbers: ParsedNumbers): CreateContractInput {
  const method = values.calculationMethod;
  const tag = values.tag.trim();
  return {
    customerId: values.customer?.id ?? '',
    productName: values.productName.trim(),
    tag: tag || undefined,
    productPrice: toMinorUnits(numbers.productPrice ?? 0),
    downPayment: toMinorUnits(numbers.downPayment ?? 0),
    costPrice: values.costPrice.trim() ? toMinorUnits(numbers.costPrice ?? 0) : undefined,
    image: values.image?.base64,
    calculationMethod: method,
    markupPercent: method === 'MARKUP_PERCENT' ? (numbers.markupPercent ?? undefined) : undefined,
    installmentCount: method !== 'FIXED_AMOUNT' ? (numbers.installmentCount ?? undefined) : undefined,
    fixedInstallmentAmount:
      method === 'FIXED_AMOUNT' ? toMinorUnits(numbers.fixedInstallmentAmount ?? 0) : undefined,
    recurrenceType: values.recurrenceType,
    intervalDays: values.recurrenceType === 'EVERY_X_DAYS' ? (numbers.intervalDays ?? undefined) : undefined,
    startDate: values.startDate,
    firstPaymentDate: values.firstPaymentDate,
  };
}

export function useContractForm(initialCustomer: SelectedCustomer | null) {
  const [values, setValues] = useState<ContractFormValues>(() => initialValues(initialCustomer));
  const [showErrors, setShowErrors] = useState(false);

  const numbers = useMemo(() => parseNumbers(values), [values]);
  const preview = useMemo(() => buildPreview(values, numbers), [values, numbers]);
  const errorCodes = useMemo(() => validate(values, numbers, preview), [values, numbers, preview]);

  const setField = <K extends keyof ContractFormValues>(field: K, value: ContractFormValues[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const submitPayload = (): CreateContractInput | null => {
    setShowErrors(true);
    return Object.keys(errorCodes).length === 0 ? buildPayload(values, numbers) : null;
  };

  return {
    values,
    setField,
    preview,
    errorCodes: showErrors ? errorCodes : {},
    submitPayload,
  };
}
