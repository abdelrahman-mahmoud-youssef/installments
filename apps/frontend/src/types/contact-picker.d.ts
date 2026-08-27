export {};

declare global {
  interface ContactPickerContact {
    tel?: string[];
    name?: string[];
  }

  interface ContactsManager {
    select(properties: string[], options?: { multiple?: boolean }): Promise<ContactPickerContact[]>;
  }

  interface Navigator {
    contacts?: ContactsManager;
  }
}
