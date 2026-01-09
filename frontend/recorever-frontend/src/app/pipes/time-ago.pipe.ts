import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow, format, differenceInHours, parseISO } from 'date-fns';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    try {
      const dateString = typeof value === 'string'
          && !value.includes('Z')
          && !value.includes('+') 
                         ? `${value}Z` 
                         : value;

      const date = new Date(dateString);
      const now = new Date();

      const hoursDiff = differenceInHours(now, date);

      if (hoursDiff >= 24) {
        return format(date, 'MMM d, yyyy');
      }

      return formatDistanceToNow(date, { addSuffix: true });
      
    } catch (e: unknown) {
      return 'Invalid date';
    }
  }
}