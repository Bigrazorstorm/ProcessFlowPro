import { DeadlineCalculatorService } from './deadline-calculator.service';
import {
  DeadlineRuleType,
  CalendarPeriod,
  GermanLegalDeadline,
  RelativeWorkdaysRule,
  RelativeCalendarEndRule,
  FixedDayOfMonthRule,
  DependentRule,
  LegalRule,
} from './dto/deadline-rule.dto';
import { addDays, addMonths, endOfMonth, endOfQuarter, endOfYear } from 'date-fns';

describe('DeadlineCalculatorService', () => {
  let service: DeadlineCalculatorService;

  beforeEach(() => {
    service = new DeadlineCalculatorService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('RELATIVE_WORKDAYS', () => {
    it('should calculate 5 workdays from Tuesday', () => {
      // Tuesday, Feb 24, 2026
      const referenceDate = new Date(2026, 1, 24);
      const rule: RelativeWorkdaysRule = {
        type: DeadlineRuleType.RELATIVE_WORKDAYS,
        days: 5,
      };

      const result = service.calculate(rule, { referenceDate });

      // Should be: Wed 25 + Thu 26 + Fri 27 + Mon 2 + Tue 3 (skip weekend)
      const expected = new Date(2026, 2, 3);
      expect(result.deadline).toEqual(expected);
      expect(result.ruleName).toBe('Relative Workdays');
    });

    it('should skip weekends when calculating workdays', () => {
      // Friday, Jan 1, 2026
      const referenceDate = new Date(2026, 0, 1);
      const rule: RelativeWorkdaysRule = {
        type: DeadlineRuleType.RELATIVE_WORKDAYS,
        days: 2,
      };

      const result = service.calculate(rule, { referenceDate });

      // Fri Jan 2 + Mon Jan 5 (skips weekend)
      const expected = new Date(2026, 0, 5);
      expect(result.deadline).toEqual(expected);
    });

    it('should handle 0 workdays', () => {
      const referenceDate = new Date(2026, 1, 24);
      const rule: RelativeWorkdaysRule = {
        type: DeadlineRuleType.RELATIVE_WORKDAYS,
        days: 0,
      };

      const result = service.calculate(rule, { referenceDate });
      expect(result.deadline).toEqual(referenceDate);
    });
  });

  describe('RELATIVE_CALENDAR_END', () => {
    it('should calculate end of month', () => {
      const referenceDate = new Date(2026, 1, 15); // Feb 15
      const rule: RelativeCalendarEndRule = {
        type: DeadlineRuleType.RELATIVE_CALENDAR_END,
        period: CalendarPeriod.MONTH_END,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = endOfMonth(referenceDate);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('MONTH_END');
    });

    it('should calculate end of quarter', () => {
      const referenceDate = new Date(2026, 1, 15); // Feb 15 (Q1)
      const rule: RelativeCalendarEndRule = {
        type: DeadlineRuleType.RELATIVE_CALENDAR_END,
        period: CalendarPeriod.QUARTER_END,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = endOfQuarter(referenceDate);
      expect(result.deadline).toEqual(expected);
    });

    it('should calculate end of year', () => {
      const referenceDate = new Date(2026, 5, 15); // Jun 15
      const rule: RelativeCalendarEndRule = {
        type: DeadlineRuleType.RELATIVE_CALENDAR_END,
        period: CalendarPeriod.YEAR_END,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = endOfYear(referenceDate);
      expect(result.deadline).toEqual(expected);
    });

    it('should apply offset days after calendar end', () => {
      const referenceDate = new Date(2026, 0, 15); // Jan 15
      const rule: RelativeCalendarEndRule = {
        type: DeadlineRuleType.RELATIVE_CALENDAR_END,
        period: CalendarPeriod.MONTH_END,
        offsetDays: 10,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), 10);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('10 days');
    });
  });

  describe('FIXED_DAY_OF_MONTH', () => {
    it('should calculate next 15th of month', () => {
      const referenceDate = new Date(2026, 1, 10); // Feb 10
      const rule: FixedDayOfMonthRule = {
        type: DeadlineRuleType.FIXED_DAY_OF_MONTH,
        dayOfMonth: 15,
      };

      const result = service.calculate(rule, { referenceDate });
      expect(result.deadline).toEqual(new Date(2026, 1, 15));
    });

    it('should move to next month if day has passed', () => {
      const referenceDate = new Date(2026, 1, 20); // Feb 20
      const rule: FixedDayOfMonthRule = {
        type: DeadlineRuleType.FIXED_DAY_OF_MONTH,
        dayOfMonth: 15,
      };

      const result = service.calculate(rule, { referenceDate });
      expect(result.deadline).toEqual(new Date(2026, 2, 15)); // Mar 15
    });

    it('should handle end-of-month days', () => {
      const referenceDate = new Date(2026, 0, 15); // Jan 15
      const rule: FixedDayOfMonthRule = {
        type: DeadlineRuleType.FIXED_DAY_OF_MONTH,
        dayOfMonth: 31,
      };

      const result = service.calculate(rule, { referenceDate });
      expect(result.deadline).toEqual(new Date(2026, 0, 31)); // Jan 31
    });
  });

  describe('DEPENDENT', () => {
    it('should calculate deadline based on previous step completion', () => {
      const referenceDate = new Date(2026, 1, 24);
      const previousCompletion = new Date(2026, 1, 20);
      const rule: DependentRule = {
        type: DeadlineRuleType.DEPENDENT,
        previousStepId: 'step-123',
        offsetDays: 5,
      };

      const result = service.calculate(rule, {
        referenceDate,
        previousStepCompletionDate: previousCompletion,
      });

      const expected = addDays(previousCompletion, 5);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('5 days');
      expect(result.description).toContain('step-123');
    });

    it('should throw error if previousStepCompletionDate is missing', () => {
      const referenceDate = new Date(2026, 1, 24);
      const rule: DependentRule = {
        type: DeadlineRuleType.DEPENDENT,
        previousStepId: 'step-123',
        offsetDays: 5,
      };

      expect(() => service.calculate(rule, { referenceDate })).toThrow(
        'Dependent rule requires previousStepCompletionDate',
      );
    });
  });

  describe('LEGAL', () => {
    it('should calculate Lohnsteuermeldung deadline (10 days after quarter end)', () => {
      const referenceDate = new Date(2026, 1, 15); // Q1
      const rule: LegalRule = {
        type: DeadlineRuleType.LEGAL,
        deadline: GermanLegalDeadline.LOHNSTEUERMELDUNG,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfQuarter(referenceDate), 10);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('Lohnsteuermeldung');
    });

    it('should calculate Sozialversicherung deadline (15 days after month end)', () => {
      const referenceDate = new Date(2026, 0, 15);
      const rule: LegalRule = {
        type: DeadlineRuleType.LEGAL,
        deadline: GermanLegalDeadline.SOZIALVERSICHERUNG,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), 15);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('Sozialversicherung');
    });

    it('should calculate Umlage U1/U2 deadline (20 days after month end)', () => {
      const referenceDate = new Date(2026, 0, 15);
      const rule: LegalRule = {
        type: DeadlineRuleType.LEGAL,
        deadline: GermanLegalDeadline.UMLAGE_U1_U2,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), 20);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('Umlage U1/U2');
    });

    it('should calculate Rechnung Erstellen deadline (10 days after month end)', () => {
      const referenceDate = new Date(2026, 0, 15);
      const rule: LegalRule = {
        type: DeadlineRuleType.LEGAL,
        deadline: GermanLegalDeadline.RECHNUNG_ERSTELLEN,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), 10);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('Rechnung erstellen');
    });

    it('should calculate Abrechnung Zahlbar deadline (15 days after month end)', () => {
      const referenceDate = new Date(2026, 0, 15);
      const rule: LegalRule = {
        type: DeadlineRuleType.LEGAL,
        deadline: GermanLegalDeadline.ABRECHNUNG_ZAHLBAR,
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), 15);
      expect(result.deadline).toEqual(expected);
      expect(result.description).toContain('Abrechnung zahlbar');
    });
  });

  describe('Default reference date', () => {
    it('should use today as default reference date', () => {
      const rule: FixedDayOfMonthRule = {
        type: DeadlineRuleType.FIXED_DAY_OF_MONTH,
        dayOfMonth: 15,
      };

      const result = service.calculate(rule);

      expect(result.deadline).toBeDefined();
      expect(result.deadline).toBeInstanceOf(Date);
    });
  });

  describe('Edge cases', () => {
    it('should handle calculating across multiple months', () => {
      const referenceDate = new Date(2026, 0, 28); // Jan 28
      const rule: RelativeWorkdaysRule = {
        type: DeadlineRuleType.RELATIVE_WORKDAYS,
        days: 10,
      };

      const result = service.calculate(rule, { referenceDate });

      // Should span into February
      expect(result.deadline.getMonth()).toBeGreaterThanOrEqual(1);
    });

    it('should handle leap year days correctly', () => {
      // 2024 is a leap year
      const referenceDate = new Date(2024, 1, 25); // Feb 25, 2024
      const rule: FixedDayOfMonthRule = {
        type: DeadlineRuleType.FIXED_DAY_OF_MONTH,
        dayOfMonth: 29,
      };

      const result = service.calculate(rule, { referenceDate });
      expect(result.deadline).toEqual(new Date(2024, 1, 29)); // Feb 29 exists in 2024
    });

    it('should handle negative offsets for relative calendar end', () => {
      const referenceDate = new Date(2026, 0, 15);
      const rule: RelativeCalendarEndRule = {
        type: DeadlineRuleType.RELATIVE_CALENDAR_END,
        period: CalendarPeriod.MONTH_END,
        offsetDays: -5, // 5 days before month end
      };

      const result = service.calculate(rule, { referenceDate });
      const expected = addDays(endOfMonth(referenceDate), -5);
      expect(result.deadline).toEqual(expected);
    });
  });
});
