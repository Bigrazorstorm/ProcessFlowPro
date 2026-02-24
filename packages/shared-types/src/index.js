"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadlineRuleType = exports.TicketPriority = exports.TicketStatus = exports.TicketType = exports.WorkflowStepType = exports.WorkflowStepStatus = exports.WorkflowInstanceStatus = exports.UserRole = void 0;
// Enums - User Roles
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["OWNER"] = "owner";
    UserRole["SENIOR"] = "senior";
    UserRole["ACCOUNTANT"] = "accountant";
    UserRole["TRAINEE"] = "trainee";
})(UserRole || (exports.UserRole = UserRole = {}));
// Enums - Workflow Status
var WorkflowInstanceStatus;
(function (WorkflowInstanceStatus) {
    WorkflowInstanceStatus["ACTIVE"] = "active";
    WorkflowInstanceStatus["DELAYED"] = "delayed";
    WorkflowInstanceStatus["CRITICAL"] = "critical";
    WorkflowInstanceStatus["COMPLETED"] = "completed";
    WorkflowInstanceStatus["ARCHIVED"] = "archived";
})(WorkflowInstanceStatus || (exports.WorkflowInstanceStatus = WorkflowInstanceStatus = {}));
// Enums - Step Status
var WorkflowStepStatus;
(function (WorkflowStepStatus) {
    WorkflowStepStatus["OPEN"] = "open";
    WorkflowStepStatus["IN_PROGRESS"] = "in_progress";
    WorkflowStepStatus["PENDING_APPROVAL"] = "pending_approval";
    WorkflowStepStatus["DONE"] = "done";
    WorkflowStepStatus["SHIFTED"] = "shifted";
    WorkflowStepStatus["SKIPPED"] = "skipped";
    WorkflowStepStatus["REJECTED"] = "rejected";
})(WorkflowStepStatus || (exports.WorkflowStepStatus = WorkflowStepStatus = {}));
// Enums - Step Type
var WorkflowStepType;
(function (WorkflowStepType) {
    WorkflowStepType["START"] = "start";
    WorkflowStepType["END"] = "end";
    WorkflowStepType["TASK"] = "task";
    WorkflowStepType["DECISION"] = "decision";
    WorkflowStepType["PARALLEL_GATEWAY"] = "parallel_gateway";
    WorkflowStepType["SYNC_GATEWAY"] = "sync_gateway";
    WorkflowStepType["EVENT"] = "event";
    WorkflowStepType["SUBPROCESS"] = "subprocess";
    WorkflowStepType["FORM_INPUT"] = "form_input";
    WorkflowStepType["NOTIFICATION"] = "notification";
    WorkflowStepType["APPROVAL"] = "approval";
})(WorkflowStepType || (exports.WorkflowStepType = WorkflowStepType = {}));
// Enums - Ticket Type
var TicketType;
(function (TicketType) {
    TicketType["PROBLEM"] = "problem";
    TicketType["ADDITIONAL_TASK"] = "additional_task";
    TicketType["INQUIRY"] = "inquiry";
    TicketType["CORRECTION"] = "correction";
    TicketType["CARRYOVER"] = "carryover";
    TicketType["EMPLOYEE_EVENT"] = "employee_event";
    TicketType["EXPIRY_WARNING"] = "expiry_warning";
})(TicketType || (exports.TicketType = TicketType = {}));
// Enums - Ticket Status
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "open";
    TicketStatus["IN_PROGRESS"] = "in_progress";
    TicketStatus["WAITING_EXTERNAL"] = "waiting_external";
    TicketStatus["DONE"] = "done";
    TicketStatus["SHIFTED"] = "shifted";
    TicketStatus["CANCELLED"] = "cancelled";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
// Enums - Ticket Priority
var TicketPriority;
(function (TicketPriority) {
    TicketPriority["LOW"] = "low";
    TicketPriority["NORMAL"] = "normal";
    TicketPriority["HIGH"] = "high";
    TicketPriority["CRITICAL"] = "critical";
})(TicketPriority || (exports.TicketPriority = TicketPriority = {}));
// Enums - Deadline Rule Type
var DeadlineRuleType;
(function (DeadlineRuleType) {
    DeadlineRuleType["RELATIVE_WORKDAYS"] = "relative_workdays";
    DeadlineRuleType["RELATIVE_CALENDAR_END"] = "relative_calendar_end";
    DeadlineRuleType["FIXED_DAY_OF_MONTH"] = "fixed_day_of_month";
    DeadlineRuleType["LEGAL"] = "legal";
    DeadlineRuleType["DEPENDENT"] = "dependent";
})(DeadlineRuleType || (exports.DeadlineRuleType = DeadlineRuleType = {}));
//# sourceMappingURL=index.js.map