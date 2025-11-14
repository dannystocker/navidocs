/**
 * Navigation Helper Composable
 * Provides utilities for cross-module navigation between feature modules
 */

import { useRouter } from 'vue-router'

export function useNavigation() {
  const router = useRouter()

  /**
   * Navigate to inventory for a specific boat
   */
  function goToInventory(boatId) {
    router.push({
      name: 'inventory',
      params: { boatId }
    })
  }

  /**
   * Navigate to maintenance for a specific boat
   */
  function goToMaintenance(boatId) {
    router.push({
      name: 'maintenance',
      params: { boatId }
    })
  }

  /**
   * Navigate to cameras for a specific boat
   */
  function goToCameras(boatId) {
    router.push({
      name: 'cameras',
      params: { boatId }
    })
  }

  /**
   * Navigate to contacts (no boat parameter)
   */
  function goToContacts() {
    router.push({
      name: 'contacts'
    })
  }

  /**
   * Navigate to expenses for a specific boat
   */
  function goToExpenses(boatId) {
    router.push({
      name: 'expenses',
      params: { boatId }
    })
  }

  /**
   * Navigate to a specific contact's details with source module
   * Useful for "view service provider" from maintenance
   */
  function viewContactFromModule(contactId, sourceModule, boatId) {
    router.push({
      name: 'contacts',
      query: { contact: contactId, from: sourceModule, boat: boatId }
    })
  }

  /**
   * Navigate to an expense from inventory
   * Useful for "view purchase expense" from inventory
   */
  function viewExpenseFromInventory(expenseId, boatId) {
    router.push({
      name: 'expenses',
      params: { boatId },
      query: { item: expenseId, from: 'inventory' }
    })
  }

  /**
   * Navigate to maintenance record from expenses
   * Useful for "view associated maintenance" from expense
   */
  function viewMaintenanceFromExpense(maintenanceId, boatId) {
    router.push({
      name: 'maintenance',
      params: { boatId },
      query: { record: maintenanceId, from: 'expenses' }
    })
  }

  /**
   * Navigate back to a module with context
   */
  function goBackToModule(moduleName, boatId, context = {}) {
    const route = {
      name: moduleName,
      ...(boatId && { params: { boatId } }),
      ...(Object.keys(context).length > 0 && { query: context })
    }
    router.push(route)
  }

  /**
   * Navigate with breadcrumb restoration
   */
  function navigateWithBreadcrumb(moduleName, boatId, fromModule) {
    const route = {
      name: moduleName,
      ...(boatId && { params: { boatId } }),
      query: fromModule ? { from: fromModule } : {}
    }
    router.push(route)
  }

  return {
    goToInventory,
    goToMaintenance,
    goToCameras,
    goToContacts,
    goToExpenses,
    viewContactFromModule,
    viewExpenseFromInventory,
    viewMaintenanceFromExpense,
    goBackToModule,
    navigateWithBreadcrumb
  }
}
