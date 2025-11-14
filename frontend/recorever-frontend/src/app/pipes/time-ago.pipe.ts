import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';

@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    try {
      return formatDistanceToNow(new Date(value), { addSuffix: true });
    } catch (e) {
      console.error('Invalid date for TimeAgoPipe:', value);
      return 'Invalid date';
    }
  }
}