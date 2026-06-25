import type { ProviderId } from '../../../types/integrations';
import { StubCalendarProvider } from '../calendar/StubCalendarProvider';

export class StubCommunicationProvider extends StubCalendarProvider {
  constructor(id: ProviderId) {
    super(id, 'communication');
  }
}
