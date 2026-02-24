export enum DeadlineRuleType {
  RELATIVE_WORKDAYS = 'RELATIVE_WORKDAYS',
  RELATIVE_CALENDAR_END = 'RELATIVE_CALENDAR_END',
  FIXED_DAY_OF_MONTH = 'FIXED_DAY_OF_MONTH',
  DEPENDENT = 'DEPENDENT',
  LEGAL = 'LEGAL',
}

export enum CalendarPeriod {
  MONTH_END = 'MONTH_END',
  QUARTER_END = 'QUARTER_END',
  YEAR_END = 'YEAR_END',
}

export enum GermanLegalDeadline {
  LOHNSTEUERMELDUNG = 'LOHNSTEUERMELDUNG', // 10 days after quarter end
  SOZIALVERSICHERUNG = 'SOZIALVERSICHERUNG', // 15 days after month end
  UMLAGE_U1_U2 = 'UMLAGE_U1_U2', // 20 days after month end
  UNFALLVERSICHERUNG = 'UNFALLVERSICHERUNG', // 10 days after quarter end
  RECHNUNG_ERSTELLEN = 'RECHNUNG_ERSTELLEN', // 10 days after month end
  ABRECHNUNG_ZAHLBAR = 'ABRECHNUNG_ZAHLBAR', // 15 days after month end
}

export class RelativeWorkdaysRule {
  type: DeadlineRuleType.RELATIVE_WORKDAYS = DeadlineRuleType.RELATIVE_WORKDAYS;
  days!: number; // Number of workdays to add
  includeHolidays?: boolean; // If true, will not exclude German holidays
}

export class RelativeCalendarEndRule {
  type: DeadlineRuleType.RELATIVE_CALENDAR_END = DeadlineRuleType.RELATIVE_CALENDAR_END;
  period!: CalendarPeriod;
  offsetDays?: number; // Days to add after period end
}

export class FixedDayOfMonthRule {
  type: DeadlineRuleType.FIXED_DAY_OF_MONTH = DeadlineRuleType.FIXED_DAY_OF_MONTH;
  dayOfMonth!: number; // 1-31, day of month
}

export class DependentRule {
  type: DeadlineRuleType.DEPENDENT = DeadlineRuleType.DEPENDENT;
  previousStepId!: string; // Reference to previous step
  offsetDays!: number; // Days to add after previous step completion
}

export class LegalRule {
  type: DeadlineRuleType.LEGAL = DeadlineRuleType.LEGAL;
  deadline!: GermanLegalDeadline;
}

export type DeadlineRule = 
  | RelativeWorkdaysRule 
  | RelativeCalendarEndRule 
  | FixedDayOfMonthRule 
  | DependentRule 
  | LegalRule;

export interface DeadlineContext {
  referenceDate?: Date; // Default: today
  previousStepCompletionDate?: Date; // For DEPENDENT rule type
}

export interface DeadlineResult {
  deadline: Date;
  ruleName: string;
  description: string;
}
