import type { OperatingModel } from '../types/workspace';

export type FormCopyFieldKey =
  | 'pageTitle'
  | 'pageSubtitle'
  | 'title'
  | 'milestoneName'
  | 'submit';

export interface FormCopySlice {
  label?: string;
  placeholder?: string;
  helperText?: string;
  example?: string;
}

type CopyTree = Partial<
  Record<string, Partial<Record<Exclude<OperatingModel, 'hybrid'>, Partial<Record<FormCopyFieldKey, FormCopySlice>>>>>
>;

const GENERIC: Partial<Record<Exclude<OperatingModel, 'hybrid'>, Partial<Record<FormCopyFieldKey, FormCopySlice>>>> = {
  project: {
    pageTitle: { label: 'פרויקט חדש' },
    pageSubtitle: { label: 'ניהול שלבים, דדליינים ותשלומים' },
    title: { placeholder: 'למשל: פרויקט לקוח חדש' },
    milestoneName: { placeholder: 'למשל: שלב ראשון' },
    submit: { label: 'צור פרויקט' },
  },
  journey: {
    pageTitle: { label: 'תהליך חדש' },
    pageSubtitle: { label: 'ליווי מתמשך — מפגשים ופעולות' },
    title: { placeholder: 'למשל: תהליך ליווי חדש' },
    milestoneName: { placeholder: 'למשל: מפגש ראשון' },
    submit: { label: 'צור תהליך' },
  },
  appointment: {
    pageTitle: { label: 'פגישה חדשה' },
    title: { placeholder: 'למשל: פגישת היכרות' },
  },
  event: {
    pageTitle: { label: 'אירוע חדש' },
    title: { placeholder: 'למשל: פעילות בתאריך מוגדר' },
  },
  package: {
    pageTitle: { label: 'כרטיסייה חדשה' },
    title: { placeholder: 'למשל: חבילת 10 מפגשים' },
  },
  recurring: {
    pageTitle: { label: 'פעילות קבועה חדשה' },
    title: { placeholder: 'למשל: מפגש שבועי קבוע' },
  },
};

const PHOTOGRAPHER: CopyTree = {
  photographer: {
    project: {
      title: {
        placeholder: 'למשל: צילום משפחה',
        example: 'צילום תדמית לעסק · עריכת אלבום · הפקת יום צילום',
      },
      milestoneName: { placeholder: 'למשל: מסירת טיוטות' },
    },
    journey: {
      title: {
        placeholder: 'למשל: ליווי צילום חודשי',
        example: 'תהליך יצירת תוכן לעסק · ליווי בניית תיק עבודות',
      },
    },
    appointment: {
      title: {
        placeholder: 'למשל: פגישת תיאום',
        example: 'פגישת היכרות · בחירת תמונות',
      },
    },
    event: {
      title: {
        placeholder: 'למשל: יום צילום',
        example: 'צילום אירוע · צילום משפחתי',
      },
    },
  },
};

const BUSINESS_COPY: CopyTree = {
  ...PHOTOGRAPHER,
};

function mergeSlice(...slices: (FormCopySlice | undefined)[]): FormCopySlice {
  return slices.reduce<FormCopySlice>((acc, s) => ({ ...acc, ...s }), {});
}

export function getBusinessAwareFormCopy(params: {
  businessType?: string;
  operatingModel: OperatingModel;
  fieldKey: FormCopyFieldKey;
}): FormCopySlice {
  const model = params.operatingModel === 'hybrid' ? 'project' : params.operatingModel;
  const preset = params.businessType?.trim();

  const generic = GENERIC[model]?.[params.fieldKey];
  const byBusiness = preset ? BUSINESS_COPY[preset]?.[model]?.[params.fieldKey] : undefined;
  const byModelOnly = preset ? undefined : undefined;

  return mergeSlice(generic, byModelOnly, byBusiness);
}

export function formCopyText(
  params: {
    businessType?: string;
    operatingModel: OperatingModel;
    fieldKey: FormCopyFieldKey;
  },
  part: keyof FormCopySlice,
  fallback = '',
): string {
  const slice = getBusinessAwareFormCopy(params);
  return slice[part] ?? fallback;
}
