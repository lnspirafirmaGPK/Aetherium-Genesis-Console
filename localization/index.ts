
import { en } from './en';
import { th } from './th';

export const translations = {
    en,
    th,
};

export type TranslationKey = keyof typeof en;
