import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
];

const changeGoogleLanguage = (code: string) => {
  const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
  if (select) {
    select.value = code === 'zh' ? 'zh-CN' : code;
    select.dispatchEvent(new Event('change'));
  }
};

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [current, setCurrent] = useState(LANGUAGES[0]);

  useEffect(() => {
    const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language);
    if (currentLanguage) {
      setCurrent(currentLanguage);
    }
  }, [i18n.language]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <span>{current.flag}</span>
          <span className="hidden sm:block text-xs">{current.label}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
        {LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => {
              i18n.changeLanguage(lang.code);
              changeGoogleLanguage(lang.code);
              setCurrent(lang);
            }}
            className={current.code === lang.code ? 'bg-emerald-50 text-emerald-700' : ''}
          >
            <span className="mr-2">{lang.flag}</span>{lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
