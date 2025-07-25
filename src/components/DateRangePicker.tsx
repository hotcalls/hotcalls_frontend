import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { de } from 'date-fns/locale';

interface DateRangePickerProps {
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSelectingRange, setIsSelectingRange] = useState(false);

  const presetRanges = [
    {
      label: "Heute",
      getValue: () => ({ from: new Date(), to: new Date() })
    },
    {
      label: "Gestern", 
      getValue: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })
    },
    {
      label: "Letzte 7 Tage",
      getValue: () => ({ from: subDays(new Date(), 6), to: new Date() })
    },
    {
      label: "Letzte 30 Tage",
      getValue: () => ({ from: subDays(new Date(), 29), to: new Date() })
    },
    {
      label: "Letzte 90 Tage",
      getValue: () => ({ from: subDays(new Date(), 89), to: new Date() })
    },
    {
      label: "Diese Woche",
      getValue: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) })
    },
    {
      label: "Letzter Monat",
      getValue: () => ({ from: startOfMonth(subDays(new Date(), 30)), to: endOfMonth(subDays(new Date(), 30)) })
    },
    {
      label: "Dieses Jahr",
      getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) })
    }
  ];

  const handlePresetClick = (preset: typeof presetRanges[0]) => {
    const range = preset.getValue();
    onDateRangeChange(range);
    setIsOpen(false);
    setSelectedDate(undefined);
    setIsSelectingRange(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    if (!isSelectingRange) {
      // Erste Auswahl - setze Start und Ende auf dasselbe Datum
      setSelectedDate(date);
      onDateRangeChange({ from: date, to: date });
      setIsSelectingRange(true);
    } else {
      // Zweite Auswahl - erstelle Zeitraum
      if (selectedDate) {
        const from = date < selectedDate ? date : selectedDate;
        const to = date > selectedDate ? date : selectedDate;
        onDateRangeChange({ from, to });
      }
      setIsOpen(false);
      setSelectedDate(undefined);
      setIsSelectingRange(false);
    }
  };

  const formatDateRange = () => {
    if (format(dateRange.from, 'yyyy-MM-dd') === format(dateRange.to, 'yyyy-MM-dd')) {
      return format(dateRange.from, 'dd. MMM yyyy', { locale: de });
    }
    return `${format(dateRange.from, 'dd. MMM', { locale: de })} - ${format(dateRange.to, 'dd. MMM yyyy', { locale: de })}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[280px] justify-start">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          {/* Schnellauswahl links */}
          <div className="border-r p-4 w-[200px]">
            <div className="space-y-1">
              {presetRanges.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-8"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Kalender rechts */}
          <div className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={de}
              className="pointer-events-auto"
            />
            {isSelectingRange && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Zweites Datum für Zeitraum wählen
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}