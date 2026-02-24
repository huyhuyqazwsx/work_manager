-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_userId_fkey";

-- DropForeignKey
ALTER TABLE "compensation_balances" DROP CONSTRAINT "compensation_balances_userId_fkey";

-- DropForeignKey
ALTER TABLE "department_employees" DROP CONSTRAINT "department_employees_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "department_employees" DROP CONSTRAINT "department_employees_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "departments" DROP CONSTRAINT "departments_managerId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "leave_policy_values" DROP CONSTRAINT "leave_policy_values_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "leave_policy_values" DROP CONSTRAINT "leave_policy_values_policyId_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ot_policy_values" DROP CONSTRAINT "ot_policy_values_otTypeId_fkey";

-- DropForeignKey
ALTER TABLE "ot_policy_values" DROP CONSTRAINT "ot_policy_values_policyId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_otTypeId_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_userId_fkey";

-- DropForeignKey
ALTER TABLE "policies" DROP CONSTRAINT "policies_leaveTypeId_fkey";

-- DropForeignKey
ALTER TABLE "policy_conditions" DROP CONSTRAINT "policy_conditions_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "policy_conditions" DROP CONSTRAINT "policy_conditions_policyId_fkey";

-- AlterTable
ALTER TABLE "departments" ALTER COLUMN "managerId" DROP NOT NULL;
