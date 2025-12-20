import { Pipe, PipeTransform } from '@angular/core';

export function manageHttpResponse(response: Response) {
  if (!response.ok) {
    throw response;
  }
}

@Pipe({
  name: 'toLocalDateString',
  standalone: true,
})
export class ToLocalDateStringPipe implements PipeTransform {
  transform(value: string | undefined, type?: 'date' | 'time' | 'full') {
    if (!value) return '';
    try {
      const date = new Date(value);
      switch (type) {
        case 'date':
          return date.toLocaleDateString();
        case 'time':
          return date.toLocaleTimeString();
        case 'full':
        default:
          return date.toLocaleString();
      }
    } catch (e) {
      return 'date-not-valid: ' + value;
    }
  }
}

@Pipe({
  name: 'arrayToString',
  standalone: true,
})
export class ArrayToStringPipe implements PipeTransform {
  transform(value?: string[] | number[]) {
    if (!value) return '';
    return value.join(', ');
  }
}
