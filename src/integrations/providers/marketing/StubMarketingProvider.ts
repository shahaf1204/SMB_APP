import type { ProviderId } from '../../../types/integrations';
import { StubCalendarProvider } from '../calendar/StubCalendarProvider';

export class StubMarketingProvider extends StubCalendarProvider {
  constructor(id: ProviderId) {
    super(id, 'marketing');
  }
}
