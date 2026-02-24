import { Injectable } from '@nestjs/common';
import {
  DeadlineRule,
  DeadlineContext,
  DeadlineResult,
  DeadlineRuleType,
  CalendarPeriod,
  RelativeWorkdaysRule,
  RelativeCalendarEndRule,
  FixedDayOfMonthRule,
  DependentRule,
  LegalRule,
  GermanLegalDeadline,
} from './dto/deadline-rule.dto';
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isWeekend,
  nextDay,
  parseISO,
  isSameDay,
} from 'date-fns';
import { de } from 'date-fns/locale';

@Injectable()
export class DeadlineCalculatorService {
  private readonly germanHolidays = this.getGermanHolidays();

  /**
   * Calculate deadline based on rule and context
   */
  calculate(rule: DeadlineRule, context: DeadlineContext = {}): DeadlineResult {
    const referenceDate = context.referenceDate || new Date();

    switch (rule.type) {
      case DeadlineRuleType.RELATIVE_WORKDAYS:
        return this.calculateRelativeWorkdays(
          rule as RelativeWorkdaysRule,
          referenceDate,
        );

      case DeadlineRuleType.RELATIVE_CALENDAR_END:
        return this.calculateRelativeCalendarEnd(
          rule as RelativeCalendarEndRule,
          referenceDate,
        );

      case DeadlineRuleType.FIXED_DAY_OF_MONTH:
        return this.calculateFixedDayOfMonth(
          rule as FixedDayOfMonthRule,
          referenceDate,
        );

      case DeadlineRuleType.DEPENDENT:
        return this.calculateDependent(
          rule as DependentRule,
          referenceDate,
          context.previousStepCompletionDate,
        );

      case DeadlineRuleType.LEGAL:
        return this.calculateLegal(rule as LegalRule, referenceDate);

      default:
        throw new Error(`Unknown deadline rule type: ${(rule as any).type}`);
    }
  }

  /**
   * Calculate relative workdays: add X workdays to reference date
   */
  private calculateRelativeWorkdays(
    rule: RelativeWorkdaysRule,
    referenceDate: Date,
  ): DeadlineResult {
    let deadline = new Date(referenceDate);
    let workdaysAdded = 0;

    while (workdaysAdded < rule.days) {
      deadline = addDays(deadline, 1);

      if (this.isWorkday(deadline, rule.includeHolidays)) {
        workdaysAdded++;
      }
    }

    return {
      deadline,
      ruleName: 'Relative Workdays',
      description: `${rule.days} workdays from reference date`,
    };
  }

  /**
   * Calculate relative calendar end: end of month/quarter/year + optional offset
   */
  private calculateRelativeCalendarEnd(
    rule: RelativeCalendarEndRule,
    referenceDate: Date,
  ): DeadlineResult {
    let deadline: Date;

    switch (rule.period) {
      case CalendarPeriod.MONTH_END:
        deadline = endOfMonth(referenceDate);
        break;
      case CalendarPeriod.QUARTER_END:
        deadline = endOfQuarter(referenceDate);
        break;
      case CalendarPeriod.YEAR_END:
        deadline = endOfYear(referenceDate);
        break;
      default:
        throw new Error(`Unknown calendar period: ${(rule as any).period}`);
    }

    if (rule.offsetDays) {
      deadline = addDays(deadline, rule.offsetDays);
    }

    return {
      deadline,
      ruleName: 'Relative Calendar End',
      description: `End of ${rule.period}${rule.offsetDays ? ` + ${rule.offsetDays} days` : ''}`,
    };
  }

  /**
   * Calculate fixed day of month: always on specific day of month
   */
  private calculateFixedDayOfMonth(
    rule: FixedDayOfMonthRule,
    referenceDate: Date,
  ): DeadlineResult {
    let deadline = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      rule.dayOfMonth,
    );

    // If specified day has already passed this month, move to next month
    if (deadline <= referenceDate) {
      deadline = addMonths(deadline, 1);
    }

    return {
      deadline,
      ruleName: 'Fixed Day of Month',
      description: `${rule.dayOfMonth}. of each month`,
    };
  }

  /**
   * Calculate dependent: based on previous step completion + offset days
   */
  private calculateDependent(
    rule: DependentRule,
    referenceDate: Date,
    previousCompletionDate?: Date,
  ): DeadlineResult {
    if (!previousCompletionDate) {
      throw new Error(
        'Dependent rule requires previousStepCompletionDate in context',
      );
    }

    const deadline = addDays(previousCompletionDate, rule.offsetDays);

    return {
      deadline,
      ruleName: 'Dependent',
      description: `${rule.offsetDays} days after previous step (${rule.previousStepId}) completion`,
    };
  }

  /**
   * Calculate legal deadline: German statutory payroll deadlines
   */
  private calculateLegal(rule: LegalRule, referenceDate: Date): DeadlineResult {
    let deadline: Date;
    let description: string;

    switch (rule.deadline) {
      case GermanLegalDeadline.LOHNSTEUERMELDUNG:
        // 10 days after quarter end
        deadline = addDays(endOfQuarter(referenceDate), 10);
        description = 'Lohnsteuermeldung (10 days after quarter end)';
        break;

      case GermanLegalDeadline.SOZIALVERSICHERUNG:
        // 15 days after month end
        deadline = addDays(endOfMonth(referenceDate), 15);
        description = 'Sozialversicherungsmeldung (15 days after month end)';
        break;

      case GermanLegalDeadline.UMLAGE_U1_U2:
        // 20 days after month end
        deadline = addDays(endOfMonth(referenceDate), 20);
        description = 'Umlage U1/U2 (20 days after month end)';
        break;

      case GermanLegalDeadline.UNFALLVERSICHERUNG:
        // 10 days after quarter end
        deadline = addDays(endOfQuarter(referenceDate), 10);
        description = 'Unfallversicherungsmeldung (10 days after quarter end)';
        break;

      case GermanLegalDeadline.RECHNUNG_ERSTELLEN:
        // 10 days after month end
        deadline = addDays(endOfMonth(referenceDate), 10);
        description = 'Rechnung erstellen (10 days after month end)';
        break;

      case GermanLegalDeadline.ABRECHNUNG_ZAHLBAR:
        // 15 days after month end
        deadline = addDays(endOfMonth(referenceDate), 15);
        description = 'Abrechnung zahlbar (15 days after month end)';
        break;

      default:
        throw new Error(
          `Unknown legal deadline type: ${(rule as any).deadline}`,
        );
    }

    return {
      deadline,
      ruleName: 'Legal Deadline',
      description,
    };
  }

  /**
   * Determine if a date is a workday (not weekend and not holiday)
   */
  private isWorkday(date: Date, ignoreHolidays = false): boolean {
    // Check if weekend
    if (isWeekend(date)) {
      return false;
    }

    // Check if German holiday (unless ignoreHolidays is true)
    if (!ignoreHolidays && this.germanHolidays.some((h) => isSameDay(h, date))) {
      return false;
    }

    return true;
  }

  /**
   * Get German holidays for current/next years
   * Includes fixed and moveable holidays
   */
  private getGermanHolidays(year?: number): Date[] {
    const targetYear = year || new Date().getFullYear();
    const holidays: Date[] = [];

    // Fixed holidays
    holidays.push(new Date(targetYear, 0, 1)); // Neujahrstag
    holidays.push(new Date(targetYear, 0, 6)); // Epiphanie (optional in some states)
    holidays.push(new Date(targetYear, 4, 1)); // Tag der Arbeit
    holidays.push(new Date(targetYear, 9, 3)); // Tag der Deutschen Einheit
    holidays.push(new Date(targetYear, 11, 25)); // Weihnachtsfeiertag 1
    holidays.push(new Date(targetYear, 11, 26)); // Weihnachtsfeiertag 2

    // Moveable holidays (calculated from Easter)
    const easter = this.calculateEaster(targetYear);
    holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000)); // Good Friday
    holidays.push(new Date(easter.getTime() + 24 * 60 * 60 * 1000)); // Easter Monday
    holidays.push(new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000)); // Ascension
    holidays.push(new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000)); // Whit Monday

    return holidays;
  }

  /**
   * Calculate Easter date using Gauss algorithm
   */
  private calculateEaster(year: number): Date {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
  }
}
